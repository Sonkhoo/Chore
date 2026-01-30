import React, { useState } from 'react';
import { connectGitHub } from '../services/auth';
import '../App.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const [leetcodeUsername, setLeetcodeUsername] = useState('');

    const handleConnectGithub = async () => {
        await connectGitHub();
        // In a real app, you'd probably start polling or listening for the success event here
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Settings</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="setting-section">
                    <label>GitHub Integration</label>
                    <button className="connect-btn github" onClick={handleConnectGithub}>
                        Connect GitHub Account
                    </button>
                    <div className="status-text">Disconnected</div>
                </div>

                <div className="setting-section">
                    <label>LeetCode Username</label>
                    <input
                        type="text"
                        placeholder="e.g. saankha_dev"
                        value={leetcodeUsername}
                        onChange={(e) => setLeetcodeUsername(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};
