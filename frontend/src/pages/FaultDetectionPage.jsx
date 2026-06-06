import React, { useState } from 'react';
import { DiagnosticForm } from '../components/fault-detection/DiagnosticForm';
import { ResultCard } from '../components/fault-detection/ResultCard';
import { RaiseRequestModal } from '../components/fault-detection/RaiseRequestModal';

export const FaultDetectionPage = () => {
  const [result, setResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDiagnosticSubmit = (data) => {
    setResult(data);
  };

  const handleRaiseRequestClick = () => {
    setIsModalOpen(true);
  };

  const handleModalSubmit = (requestData) => {
    console.log("Mock Request Submitted:", requestData);
    // In Phase 2, this will POST to /api/requests
    alert(`Request raised successfully for Plant ${requestData.telemetry.plantId} Unit ${requestData.telemetry.unitId} with ${requestData.priority} priority.`);
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', position: 'relative', minHeight: '80vh' }}>
      <h2 style={{ marginBottom: '24px', fontWeight: 600 }}>Turbine Fault Detection Module</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Left Panel: Inputs */}
        <DiagnosticForm onDiagnosticSubmit={handleDiagnosticSubmit} />
        
        {/* Right Panel: Results */}
        <div>
          <ResultCard result={result} onRaiseRequest={handleRaiseRequestClick} />
        </div>
      </div>

      <RaiseRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        result={result}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};
