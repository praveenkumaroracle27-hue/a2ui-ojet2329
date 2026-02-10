import React from 'react';
import './App.css';

// Placeholder components simulating OJet/A2UI integration for POC
const OJetButton = ({ label, onClick }) => <button onClick={onClick}>{label}</button>;
const OJetInputText = ({ placeholder, value, onChange }) => <input type="text" placeholder={placeholder} value={value} onChange={onChange} />;
const OJetTable = ({ data }) => (
  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
    <thead>
      <tr>
        <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Name</th>
        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Email</th>
      </tr>
    </thead>
    <tbody>
      {data.map((row, i) => (
        <tr key={i}>
          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.id}</td>
          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.name}</td>
          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.email}</td>
        </tr>
      ))}
    </tbody>
  </table>
);
const OJetDatePicker = ({ placeholder }) => <input type="date" placeholder={placeholder} />;
const OJetChart = ({ data }) => <div style={{ height: '200px', border: '1px solid #ccc', padding: '10px' }}>OJet Chart Placeholder: {JSON.stringify(data)}</div>;

// Simulated A2UI Renderer using placeholders
const SimulatedA2UIRenderer = ({ children, onAction }) => {
  // In real implementation, this would render based on A2UI messages
  // For POC, render static demo
  const handleButtonClick = () => {
    console.log('Simulated A2UI action: Submit');
    onAction && onAction({ type: 'submit' });
  };

  const sampleData = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Simulated A2UI + OJet Demo</h2>
      <p>This POC demonstrates the structure for A2UI integration with Oracle JET components.</p>
      <div style={{ marginBottom: '20px' }}>
        <h3>Customer Table (OJetTable)</h3>
        <OJetTable data={sampleData} />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <h3>Customer Form (OJetInputText + OJetDatePicker + OJetButton)</h3>
        <OJetInputText placeholder="Enter name" />
        <br /><br />
        <OJetDatePicker placeholder="Select date" />
        <br /><br />
        <OJetButton label="Submit" onClick={handleButtonClick} />
      </div>
      <div>
        <h3>Chart (OJetChart)</h3>
        <OJetChart data={{ series: [{ name: "Sales", data: [10, 20, 30] }] }} />
      </div>
      <p><em>Note: In production, A2UI agent generates dynamic components from REST API data.</em></p>
    </div>
  );
};

function App() {
  const handleAction = (action) => {
    console.log('Handled action:', action);
    // Simulate agent processing
    alert('Action processed by simulated A2UI agent!');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>A2UI OJet POC</h1>
        <p>Proof of Concept for A2UI Implementation Examples</p>
        <p>View README.md for migration guides and data flows.</p>
      </header>
      <SimulatedA2UIRenderer onAction={handleAction}>
        {/* Children would be dynamic in real A2UI */}
      </SimulatedA2UIRenderer>
    </div>
  );
}

export default App;
