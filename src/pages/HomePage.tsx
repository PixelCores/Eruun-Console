import React from 'react';
import FlowCanvas from '../components/FlowCanvas';
import Sidebar from '../components/Sidebar';
import PropertyPanel from '../components/PropertyPanel';

const HomePage: React.FC = () => {
    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header
                style={{
                    height: '60px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 24px',
                    background: '#fff',
                    zIndex: 10,
                }}
            >
                <div style={{ fontWeight: 700, fontSize: '18px', color: '#0f172a' }}>
                    Eruun Console
                </div>
            </header>
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <Sidebar />
                <main style={{ flex: 1, position: 'relative' }}>
                    <FlowCanvas />
                    <PropertyPanel />
                </main>
            </div>
        </div>
    );
};

export default HomePage;
