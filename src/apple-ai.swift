import Foundation
import FoundationModels

// MARK: - C-compatible data structures

@available(macOS 26.0, *)

@_cdecl("apple_ai_init")
public func appleAIInit() -> Bool {
    // Initialize and return success status
    return true
}

@_cdecl("apple_ai_check_availability")
public func appleAICheckAvailability() -> Int32 {
    let model = SystemLanguageModel.default
    let availability = model.availability
    
    switch availability {
    case .available:
        return 1 // Available
    case .unavailable(let reason):
        switch reason {
        case .deviceNotEligible:
            return -1 // Device not eligible
        case .appleIntelligenceNotEnabled:
            return -2 // Apple Intelligence not enabled
        case .modelNotReady:
            return -3 // Model not ready
        @unknown default:
            return -99 // Unknown error
        }
    @unknown default:
        return -99 // Unknown error
    }
}

@_cdecl("apple_ai_get_availability_reason")
public func appleAIGetAvailabilityReason() -> UnsafeMutablePointer<CChar>? {
    let model = SystemLanguageModel.default
    let availability = model.availability
    
    switch availability {
    case .available:
        return strdup("Model is available")
    case .unavailable(let reason):
        let reasonString: String
        switch reason {
        case .deviceNotEligible:
            reasonString = "Device not eligible for Apple Intelligence. Supported devices: iPhone 15 Pro/Pro Max or newer, iPad with M1 chip or newer, Mac with Apple Silicon"
        case .appleIntelligenceNotEnabled:
            reasonString = "Apple Intelligence not enabled. Enable it in Settings > Apple Intelligence & Siri"
        case .modelNotReady:
            reasonString = "AI model not ready. Models are downloaded automatically based on network status, battery level, and system load. Please wait and try again later."
        @unknown default:
            reasonString = "Unknown availability issue"
        }
        return strdup(reasonString)
    @unknown default:
        return strdup("Unknown availability status")
    }
}

@_cdecl("apple_ai_get_supported_languages_count")
public func appleAIGetSupportedLanguagesCount() -> Int32 {
    let model = SystemLanguageModel.default
    return Int32(Array(model.supportedLanguages).count)
}

@_cdecl("apple_ai_get_supported_language")
public func appleAIGetSupportedLanguage(index: Int32) -> UnsafeMutablePointer<CChar>? {
    let model = SystemLanguageModel.default
    let languagesArray = Array(model.supportedLanguages)
    
    guard index >= 0 && index < Int32(languagesArray.count) else {
        return nil
    }
    
    let language = languagesArray[Int(index)]
    let locale = Locale(identifier: language.maximalIdentifier)
    
    // Get the display name in the current locale
    if let displayName = locale.localizedString(forIdentifier: language.maximalIdentifier) {
        return strdup(displayName)
    }
    
    // Fallback to language code if display name is not available
    if let languageCode = language.languageCode?.identifier {
        return strdup(languageCode)
    }
    
    return strdup("Unknown")
}

@_cdecl("apple_ai_generate_response")
public func appleAIGenerateResponse(
    prompt: UnsafePointer<CChar>,
    temperature: Double,
    maxTokens: Int32
) -> UnsafeMutablePointer<CChar>? {
    let promptString = String(cString: prompt)
    
    // Use semaphore to convert async to sync
    let semaphore = DispatchSemaphore(value: 0)
    var result: String = "Error: No response"
    
    Task {
        do {
            let model = SystemLanguageModel.default
            
            // Check availability first
            let availability = model.availability
            guard case .available = availability else {
                result = "Error: Apple Intelligence not available"
                semaphore.signal()
                return
            }
            
            // Create session
            let session = LanguageModelSession()
            
            // Create generation options
            var options = GenerationOptions()
            if temperature > 0 {
                options = GenerationOptions(temperature: temperature, maximumResponseTokens: maxTokens > 0 ? Int(maxTokens) : nil)
            } else if maxTokens > 0 {
                options = GenerationOptions(maximumResponseTokens: Int(maxTokens))
            }
            
            // Generate response
            let response = try await session.respond(to: promptString, options: options)
            result = response.content
            
        } catch {
            result = "Error: \(error.localizedDescription)"
        }
        
        semaphore.signal()
    }
    
    // Wait for async operation to complete
    semaphore.wait()
    
    return strdup(result)
}

@_cdecl("apple_ai_generate_response_with_history")
public func appleAIGenerateResponseWithHistory(
    messagesJson: UnsafePointer<CChar>,
    temperature: Double,
    maxTokens: Int32
) -> UnsafeMutablePointer<CChar>? {
    let messagesJsonString = String(cString: messagesJson)
    
    // Use semaphore to convert async to sync
    let semaphore = DispatchSemaphore(value: 0)
    var result: String = "Error: No response"
    
    Task {
        do {
            let model = SystemLanguageModel.default
            
            // Check availability first
            let availability = model.availability
            guard case .available = availability else {
                result = "Error: Apple Intelligence not available"
                semaphore.signal()
                return
            }
            
            // Parse messages from JSON
            guard let messagesData = messagesJsonString.data(using: .utf8) else {
                result = "Error: Invalid JSON data"
                semaphore.signal()
                return
            }
            
            let messages = try JSONDecoder().decode([ChatMessage].self, from: messagesData)
            
            guard !messages.isEmpty else {
                result = "Error: No messages provided"
                semaphore.signal()
                return
            }
            
            // Get the last message as the current prompt
            let lastMessage = messages.last!
            let currentPrompt = lastMessage.content
            
            // Convert previous messages to transcript for conversation context
            let previousMessages = messages.count > 1 ? Array(messages.dropLast()) : []
            let transcriptEntries = convertMessagesToTranscript(previousMessages)
            
            // Create session with conversation history
            let transcript = Transcript(entries: transcriptEntries)
            let session = LanguageModelSession(transcript: transcript)
            
            // Create generation options
            var options = GenerationOptions()
            if temperature > 0 {
                options = GenerationOptions(temperature: temperature, maximumResponseTokens: maxTokens > 0 ? Int(maxTokens) : nil)
            } else if maxTokens > 0 {
                options = GenerationOptions(maximumResponseTokens: Int(maxTokens))
            }
            
            // Generate response using the current prompt with history
            let response = try await session.respond(to: currentPrompt, options: options)
            result = response.content
            
        } catch {
            result = "Error: \(error.localizedDescription)"
        }
        
        semaphore.signal()
    }
    
    // Wait for async operation to complete
    semaphore.wait()
    
    return strdup(result)
}

@_cdecl("apple_ai_free_string")
public func appleAIFreeString(ptr: UnsafeMutablePointer<CChar>?) {
    if let ptr = ptr {
        free(ptr)
    }
}

// MARK: - Helper functions

private struct ChatMessage: Codable {
    let role: String
    let content: String
    let name: String?
    
    init(role: String, content: String, name: String? = nil) {
        self.role = role
        self.content = content
        self.name = name
    }
}

private func convertMessagesToTranscript(_ messages: [ChatMessage]) -> [Transcript.Entry] {
    var entries: [Transcript.Entry] = []
    
    // Process all messages in order
    for message in messages {
        let textSegment = Transcript.TextSegment(content: message.content)
        
        switch message.role.lowercased() {
        case "system":
            // Convert system messages to instructions
            let instructions = Transcript.Instructions(
                segments: [.text(textSegment)],
                toolDefinitions: []
            )
            entries.append(.instructions(instructions))
            
        case "user":
            // Convert user messages to prompts
            let prompt = Transcript.Prompt(
                segments: [.text(textSegment)]
            )
            entries.append(.prompt(prompt))
            
        case "assistant":
            // Convert assistant messages to responses
            let response = Transcript.Response(
                assetIDs: [],
                segments: [.text(textSegment)]
            )
            entries.append(.response(response))
            
        default:
            // Treat unknown roles as user messages
            let prompt = Transcript.Prompt(
                segments: [.text(textSegment)]
            )
            entries.append(.prompt(prompt))
        }
    }
    
    return entries
}

@available(macOS 26.0, *)
@_cdecl("apple_ai_generate_response_stream")
public func appleAIGenerateResponseStream(
    _ prompt: UnsafePointer<CChar>,
    _ temperature: Double,
    _ maxTokens: Int32,
    _ onChunk: (@convention(c) (UnsafePointer<CChar>?) -> Void)
) {
    let promptString = String(cString: prompt)

    Task.detached {
        do {
            let model = SystemLanguageModel.default
            guard case .available = model.availability else {
                emitError("Model unavailable", to: onChunk)
                return
            }

            var options = GenerationOptions()
            if temperature != 0.0 { options.temperature = temperature }
            if maxTokens > 0 { options.maximumResponseTokens = Int(maxTokens) }

            let session = LanguageModelSession(model: model)

            var prev = ""
            for try await cumulative in session.streamResponse(to: promptString, options: options) {
                let delta = String(cumulative.dropFirst(prev.count))
                prev = cumulative
                guard !delta.isEmpty, delta.first != ERROR_SENTINEL else { continue }

                delta.withCString { cStr in
                    onChunk(strdup(cStr))
                }
            }
            onChunk(nil)        // stream finished
        } catch {
            emitError(error.localizedDescription, to: onChunk)
        }
    }
}

// Control-B (0x02) sentinel prefix marks an error string in streaming callbacks
private let ERROR_SENTINEL: Character = "\u{0002}"

@inline(__always)
private func emitError(_ message: String, to onChunk: (@convention(c) (UnsafePointer<CChar>?) -> Void)) {
    let full = String(ERROR_SENTINEL) + message
    full.withCString { cStr in
        onChunk(strdup(cStr))
    }
} 