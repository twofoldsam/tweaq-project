import { useState, useEffect } from 'react';
import './LLMSettings.css';

interface LLMConfig {
  provider: string;
  hasApiKey?: boolean;
}

export function LLMSettings() {
  const [config, setConfig] = useState<LLMConfig>({ provider: 'mock' });
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const result = await window.electronAPI.llmGetConfig();
      setConfig(result);
    } catch (error) {
      console.error('Error loading LLM config:', error);
      setError('Failed to load LLM configuration');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await window.electronAPI.llmSaveConfig({
        provider: config.provider,
        apiKey: apiKey || undefined
      });
      
      if (result.success) {
        setSuccess('LLM configuration saved successfully');
        setApiKey(''); // Clear the input field
        await loadConfig(); // Reload to get updated hasApiKey status
      } else {
        setError(result.error || 'Failed to save configuration');
      }
    } catch (error) {
      setError('Failed to save LLM configuration');
      console.error('Error saving LLM config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const result = await window.electronAPI.llmTestConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: 'Connection test failed' });
      console.error('Error testing LLM connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
    setTestResult(null);
  };

  return (
    <div className="llm-settings">
      <div className="llm-settings-header">
        <h2>LLM Provider Configuration</h2>
        <p>Configure AI language model providers for enhanced code mapping</p>
      </div>

      <div className="llm-settings-content">
        <div className="provider-selection">
          <h3>Provider</h3>
          <div className="provider-options">
            <label className="provider-option">
              <input
                type="radio"
                name="provider"
                value="mock"
                checked={config.provider === 'mock'}
                onChange={(e) => {
                  setConfig({ ...config, provider: e.target.value });
                  clearMessages();
                }}
              />
              <div className="provider-info">
                <strong>Mock Provider</strong>
                <span>Basic functionality for testing (no API key required)</span>
              </div>
            </label>

            <label className="provider-option">
              <input
                type="radio"
                name="provider"
                value="openai"
                checked={config.provider === 'openai'}
                onChange={(e) => {
                  setConfig({ ...config, provider: e.target.value });
                  clearMessages();
                }}
              />
              <div className="provider-info">
                <strong>OpenAI</strong>
                <span>GPT-4 for advanced code analysis and mapping</span>
                {config.provider === 'openai' && config.hasApiKey && (
                  <span className="api-key-status">✅ API key configured</span>
                )}
              </div>
            </label>

            <label className="provider-option">
              <input
                type="radio"
                name="provider"
                value="claude"
                checked={config.provider === 'claude'}
                onChange={(e) => {
                  setConfig({ ...config, provider: e.target.value });
                  clearMessages();
                }}
              />
              <div className="provider-info">
                <strong>Anthropic Claude</strong>
                <span>Claude 3 for intelligent code understanding</span>
                {config.provider === 'claude' && config.hasApiKey && (
                  <span className="api-key-status">✅ API key configured</span>
                )}
              </div>
            </label>
          </div>
        </div>

        {config.provider !== 'mock' && (
          <div className="api-key-section">
            <h3>API Key</h3>
            <div className="api-key-input">
              <input
                type="password"
                placeholder={`Enter your ${config.provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key`}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  clearMessages();
                }}
                className="api-key-field"
              />
              <div className="api-key-help">
                {config.provider === 'openai' && (
                  <p>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Platform</a></p>
                )}
                {config.provider === 'claude' && (
                  <p>Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">Anthropic Console</a></p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="llm-actions">
          <button
            className="save-button"
            onClick={handleSave}
            disabled={loading || (config.provider !== 'mock' && !apiKey && !config.hasApiKey)}
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>

          {(config.hasApiKey || apiKey) && (
            <button
              className="test-button"
              onClick={handleTestConnection}
              disabled={loading}
            >
              {loading ? 'Testing...' : 'Test Connection'}
            </button>
          )}
        </div>

        {error && (
          <div className="message error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="message success-message">
            <strong>Success:</strong> {success}
          </div>
        )}

        {testResult && (
          <div className={`message ${testResult.success ? 'success-message' : 'error-message'}`}>
            <strong>{testResult.success ? 'Connection Test Passed:' : 'Connection Test Failed:'}</strong> 
            {testResult.message || testResult.error}
          </div>
        )}

        <div className="llm-info">
          <h3>How LLM Providers Work</h3>
          <ul>
            <li><strong>Mock Provider:</strong> Provides basic functionality for testing without external API calls</li>
            <li><strong>OpenAI:</strong> Uses GPT-4 to analyze code and improve mapping accuracy between visual edits and source files</li>
            <li><strong>Claude:</strong> Uses Anthropic's Claude 3 for intelligent code understanding and context-aware mapping</li>
          </ul>
          <p>LLM providers enhance the accuracy of mapping visual changes to source code by analyzing code patterns, component structures, and contextual relationships.</p>
        </div>
      </div>
    </div>
  );
}
