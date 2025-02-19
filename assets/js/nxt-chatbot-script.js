(function() {
	class NXTChatbot {
		constructor(container) {
			this.container = container;
			this.history = container.querySelector(".nxt-chatbot__history");
			this.input = container.querySelector(".nxt-chatbot__input, .nxt-chatbot__input--textarea");
			this.sendButton = container.querySelector(".nxt-chatbot__send-btn");
			this.quickResponsesContainer = container.querySelector(".nxt-chatbot__quick-responses");
			this.micButton = container.querySelector(".nxt-chatbot__mic-btn");

			this.isProcessing = false;
			this.isRecording = false;
			this.mediaRecorder = null;
			this.audioChunks = [];
			this.messageHistory = [];

			this.sendButton.addEventListener("click", () => {
				this.sendMessage(this.input.value);
			});

			if (this.quickResponsesContainer) {
				this.quickResponsesContainer.addEventListener("click", (e) => {
					const target = e.target;
					if (target.matches(".nxt-chatbot__quick-btn")) {
						e.preventDefault();
						const msg = target.getAttribute("data-response") ?? target.textContent;
						this.sendMessage(msg);
					}
				});
			}

			if (this.micButton) {
				this.micButton.addEventListener("click", () => this.toggleRecording());
			}

			// Check if mic button should be shown based on browser and block settings
			if (this.micButton) {
				// Hide mic button on Safari
				const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
				if (isSafari) {
					this.micButton.style.display = 'none';
				}
			}
		}

		createMessageElement(content, isUser) {
			const messageDiv = document.createElement("div");
			messageDiv.classList.add("nxt-chatbot__message");
			messageDiv.classList.add(isUser ? "nxt-chatbot__message--user" : "nxt-chatbot__message--assistant");
			messageDiv.innerHTML = content;
			return messageDiv;
		}

		createLoadingSpinner() {
			const spinner = document.createElement("div");
			spinner.classList.add("nxt-chatbot__loading-spinner");
			return spinner;
		}

		async renderProgressively(element, htmlText) {
			// Create a temporary container to parse the HTML string.
			const tempContainer = document.createElement('div');
			tempContainer.innerHTML = htmlText;

			// Clone the container structure but clear all text nodes.
			const clonedFragment = this.cloneAndClearText(tempContainer);

			// Clear the target element and insert the cloned structure.
			element.innerHTML = "";
			element.appendChild(clonedFragment);

			// Collect text node objects from the original HTML.
			const originalTextNodes = [];
			this.collectTextNodes(tempContainer, originalTextNodes);

			// Collect empty text node objects from the cloned structure.
			const targetTextNodes = [];
			this.collectTextNodes(element, targetTextNodes);

			// Progressive reveal for each text node.
			const len = Math.min(originalTextNodes.length, targetTextNodes.length);
			for (let i = 0; i < len; i++) {
				const fullText = originalTextNodes[i].textContent;
				targetTextNodes[i].textContent = "";
				for (let j = 0; j < fullText.length; j++) {
					targetTextNodes[i].textContent += fullText[j];
					await new Promise((resolve) => setTimeout(resolve, 4));
				}
			}
		}

		cloneAndClearText(sourceElement) {
			// Deep clone the element and clear all text nodes.
			const clone = sourceElement.cloneNode(true);
			const clearText = (node) => {
				if (node.nodeType === Node.TEXT_NODE) {
					node.textContent = "";
				} else {
					node.childNodes.forEach(child => clearText(child));
				}
			};
			clearText(clone);
			return clone;
		}

		collectTextNodes(element, arr) {
			// Push the text node objects rather than their textContent.
			if (element.nodeType === Node.TEXT_NODE) {
				arr.push(element);
			} else {
				element.childNodes.forEach(child => this.collectTextNodes(child, arr));
			}
		}

		updateQuickResponses(options) {
			if (!this.quickResponsesContainer) return;
			this.quickResponsesContainer.innerHTML = "";
			options.forEach((option) => {
				const btn = document.createElement("button");
				btn.classList.add("nxt-chatbot__quick-btn");
				btn.textContent = option;
				btn.setAttribute("data-response", option);
				btn.addEventListener("click", (e) => {
					e.preventDefault();
					this.sendMessage(option);
				});
				this.quickResponsesContainer.appendChild(btn);
			});
		}

		async sendMessage(message) {
			if (!message?.trim() || this.isProcessing) return;

			// Prepend the system prompt into the message history if needed.
			if (!this.messageHistory.some((msg) => msg.role === "system") && nxtChatbot.systemPrompt) {
				this.messageHistory.unshift({
					role: "system",
					content: nxtChatbot.systemPrompt
				});
			}

			this.isProcessing = true;
			this.sendButton.disabled = true;

			// Add user message to history and display it.
			this.messageHistory.push({
				role: "user",
				content: message
			});
			const userMessageDiv = this.createMessageElement(message, true);
			this.history.appendChild(userMessageDiv);

			// Create the assistant message placeholder with a loading spinner.
			const assistantMessageDiv = this.createMessageElement("", false);
			assistantMessageDiv.appendChild(this.createLoadingSpinner());
			this.history.appendChild(assistantMessageDiv);

			const chatUrl = `${nxtChatbot.apiUrl}/chat`;
			console.log("Sending chat to URL:", chatUrl);
			console.log("Message history:", this.messageHistory);

			try {
				const response = await fetch(chatUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-WP-Nonce": nxtChatbot.nonce
					},
					body: JSON.stringify({
						history: this.messageHistory,
						blockAttributes: nxtChatbot
					})
				});

				if (!response.ok) {
					throw new Error(`Chat API error: ${response.statusText}`);
				}

				const data = await response.json();
				assistantMessageDiv.innerHTML = "";
				let cleanResponse = data.response || "";
				let options = [];
				const optionsMatch = cleanResponse.match(/<response-options>(.*?)<\/response-options>/s);
				if (optionsMatch) {
					const optionsHtml = optionsMatch[1];
					const regex = /<option>(.*?)<\/option>/g;
					let match;
					while ((match = regex.exec(optionsHtml)) !== null) {
						options.push(match[1]);
					}
					cleanResponse = cleanResponse.replace(/<response-options>.*?<\/response-options>/s, "");
				}

				await this.renderProgressively(assistantMessageDiv, cleanResponse);
				this.messageHistory.push({
					role: "assistant",
					content: data.response
				});

				if (options.length > 0) {
					this.updateQuickResponses(options);
				}
			} catch (error) {
				console.error("Chat Error:", error);
				const errorDiv = this.createMessageElement(`Error: ${error.message}`, false);
				errorDiv.classList.add("nxt-chatbot__message--error");
				this.history.appendChild(errorDiv);
			} finally {
				this.isProcessing = false;
				this.sendButton.disabled = false;
				this.input.value = "";
				this.history.scrollTop = this.history.scrollHeight;
			}
		}

		async toggleRecording() {
			if (!this.isRecording) {
				try {
					// Create an AudioContext on user interaction.
					if (!this.audioContext) {
						this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
					}
					
					const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
					this.currentStream = stream;
					
					let mimeType = "audio/webm";
					if (!MediaRecorder.isTypeSupported(mimeType)) {
						const safariMimeType = "audio/mp4;codecs=mp4a.40.2";
						if (MediaRecorder.isTypeSupported(safariMimeType)) {
							mimeType = safariMimeType;
						} else if (MediaRecorder.isTypeSupported("audio/mp4")) {
							mimeType = "audio/mp4";
						} else if (MediaRecorder.isTypeSupported("audio/mpeg")) {
							mimeType = "audio/mpeg";
						}
					}
					this.recordingMimeType = mimeType;
					
					this.mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });
					this.audioChunks = [];
					
					this.mediaRecorder.addEventListener("dataavailable", event => {
						if (event.data && event.data.size > 0) {
							this.audioChunks.push(event.data);
						}
					});
					
					this.mediaRecorder.addEventListener("stop", async () => {
						console.log("Recording stopped");
						// Brief delay to ensure any pending data is flushed.
						await new Promise(resolve => setTimeout(resolve, 100));
						// Extract file extension (disregarding any codec parameters).
						const extension = this.recordingMimeType.split(";")[0].split("/")[1];
						const audioBlob = new Blob(this.audioChunks, { type: this.recordingMimeType });
						const formData = new FormData();
						formData.append("audio", audioBlob, `recording.${extension}`);
						console.log("Processing recording...");
						try {
							const response = await fetch(`${nxtChatbot.apiUrl}/transcribe`, {
								method: "POST",
								headers: {
									"X-WP-Nonce": nxtChatbot.nonce
								},
								body: formData
							});
							console.log("Response status:", response.status);
							const data = await response.json();
							console.log("Transcription response:", data);
							if (data.success && data.transcription) {
								this.sendMessage(data.transcription);
							} else {
								throw new Error("Transcription failed or returned empty.");
							}
						} catch (error) {
							console.error("Transcription error:", error);
						}
					});
					
					this.mediaRecorder.start(1000);
					this.isRecording = true;
					this.micButton.classList.add('nxt-chatbot__mic-btn--recording');
					
				} catch (error) {
					console.error("Recording start error:", error);
				}
			} else {
				this.mediaRecorder.stop();
				this.isRecording = false;
				this.micButton.classList.remove('nxt-chatbot__mic-btn--recording');
				
				if (this.currentStream) {
					this.currentStream.getTracks().forEach(track => track.stop());
					this.currentStream = null;
				}
				if (this.audioContext) {
					this.audioContext.close();
					this.audioContext = null;
				}
			}
		}
	}

	document.addEventListener("DOMContentLoaded", () => {
		const containers = document.querySelectorAll(".nxt-chatbot__container");
		containers.forEach((container) => new NXTChatbot(container));
	});
})();