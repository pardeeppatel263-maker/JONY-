import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { surveyQuestions } from '../../data/initialData';
import { X, CheckCircle2, Sparkles, ArrowRight, HelpCircle } from 'lucide-react';

export const SurveyModal: React.FC = () => {
  const { isSurveyModalOpen, setIsSurveyModalOpen, submitDailySurveyTask, adminSettings } = useApp();
  const reward = adminSettings.dailySurveyReward || 150;
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  if (!isSurveyModalOpen) return null;

  const currentQ = surveyQuestions[currentStep];
  const isSelected = selectedAnswers[currentQ.id] !== undefined;
  const isLastQuestion = currentStep === surveyQuestions.length - 1;

  const handleSelectOption = (opt: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: opt,
    }));
  };

  const handleNext = () => {
    if (!isSelected) return;
    if (isLastQuestion) {
      submitDailySurveyTask(selectedAnswers);
      setCurrentStep(0);
      setSelectedAnswers({});
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-white/10 rounded-lg text-sm">📝</span>
            <div>
              <h3 className="text-xs font-bold leading-tight">Daily Consumer Survey</h3>
              <p className="text-[10px] text-blue-200">
                Question {currentStep + 1} of {surveyQuestions.length}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSurveyModalOpen(false)}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / surveyQuestions.length) * 100}%`,
            }}
          />
        </div>

        {/* Question & Options */}
        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">
              Step {currentStep + 1}
            </span>
            <h4 className="text-sm font-bold text-slate-800 leading-snug">
              {currentQ.question}
            </h4>
          </div>

          <div className="space-y-2">
            {currentQ.options.map((option, idx) => {
              const checked = selectedAnswers[currentQ.id] === option;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(option)}
                  className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                    checked
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{option}</span>
                  {checked && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div className="flex items-center gap-1 text-[11px] font-black text-emerald-600">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Reward: +₹{reward}</span>
            </div>

            <button
              onClick={handleNext}
              disabled={!isSelected}
              className={`py-2 px-5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>{isLastQuestion ? `Submit for Verification (+₹${reward})` : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
