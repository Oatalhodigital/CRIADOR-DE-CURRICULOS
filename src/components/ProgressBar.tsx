import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  
  const getProgressColor = () => {
    if (progress < 25) return 'from-red-500 to-orange-500';
    if (progress < 50) return 'from-orange-500 to-yellow-500';
    if (progress < 75) return 'from-yellow-500 to-green-500';
    return 'from-green-500 to-emerald-500';
  };

  const getStepColor = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'bg-green-500 text-white';
    if (stepIndex === currentStep) return 'bg-purple-600 text-white';
    return 'bg-gray-200 text-gray-600';
  };

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between items-center">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${getStepColor(index)}`}
            >
              {index + 1}
            </div>
            <span
              className={`text-xs mt-2 font-medium transition-colors duration-300 ${
                index <= currentStep ? 'text-purple-600' : 'text-gray-400'
              }`}
            >
              {index === 0 && 'Dados'}
              {index === 1 && 'Exp.'}
              {index === 2 && 'Form.'}
              {index === 3 && 'Hab.'}
              {index === 4 && 'Resumo'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
