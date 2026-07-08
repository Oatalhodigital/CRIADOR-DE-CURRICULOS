import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Resume, PersonalInfo, Experience, Education, Skill } from '../types/resume';
import { saveDraft } from '../services/firebase';

interface ResumeContextType {
  resume: Resume;
  updatePersonalInfo: (info: PersonalInfo) => void;
  addExperience: (experience: Experience) => void;
  updateExperience: (id: string, experience: Experience) => void;
  removeExperience: (id: string) => void;
  addEducation: (education: Education) => void;
  updateEducation: (id: string, education: Education) => void;
  removeEducation: (id: string) => void;
  addSkill: (skill: Skill) => void;
  updateSkill: (id: string, skill: Skill) => void;
  removeSkill: (id: string) => void;
  updateSummary: (summary: string) => void;
  setPaymentStatus: (paid: boolean, paymentId?: string) => void;
  setDraftId: (id: string) => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

const initialPersonalInfo: PersonalInfo = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  linkedin: '',
  website: '',
};

const initialResume: Resume = {
  personalInfo: initialPersonalInfo,
  experience: [],
  education: [],
  skills: [],
  summary: '',
  paid: false,
};

export const ResumeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [resume, setResume] = useState<Resume>(initialResume);
  const [draftId, setDraftIdState] = useState<string | null>(null);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Auto-save to Firestore on any change
  useEffect(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(async () => {
      try {
        if (resume.personalInfo.email || resume.personalInfo.fullName) {
          const savedDraftId = await saveDraft(resume);
          if (savedDraftId && !draftId) {
            setDraftIdState(savedDraftId);
          }
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000); // Debounce save for 2 seconds

    setSaveTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [resume, draftId]);

  const updatePersonalInfo = (info: PersonalInfo) => {
    setResume(prev => ({ ...prev, personalInfo: info }));
  };

  const addExperience = (experience: Experience) => {
    setResume(prev => ({
      ...prev,
      experience: [...prev.experience, experience],
    }));
  };

  const updateExperience = (id: string, experience: Experience) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? experience : exp),
    }));
  };

  const removeExperience = (id: string) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id),
    }));
  };

  const addEducation = (education: Education) => {
    setResume(prev => ({
      ...prev,
      education: [...prev.education, education],
    }));
  };

  const updateEducation = (id: string, education: Education) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? education : edu),
    }));
  };

  const removeEducation = (id: string) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id),
    }));
  };

  const addSkill = (skill: Skill) => {
    setResume(prev => ({
      ...prev,
      skills: [...prev.skills, skill],
    }));
  };

  const updateSkill = (id: string, skill: Skill) => {
    setResume(prev => ({
      ...prev,
      skills: prev.skills.map(s => s.id === id ? skill : s),
    }));
  };

  const removeSkill = (id: string) => {
    setResume(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.id !== id),
    }));
  };

  const updateSummary = (summary: string) => {
    setResume(prev => ({ ...prev, summary }));
  };

  const setPaymentStatus = (paid: boolean, paymentId?: string) => {
    setResume(prev => ({
      ...prev,
      paid,
      paymentId,
    }));
  };

  const setDraftId = (id: string) => {
    setDraftIdState(id);
    setResume(prev => ({ ...prev, id }));
  };

  return (
    <ResumeContext.Provider
      value={{
        resume,
        updatePersonalInfo,
        addExperience,
        updateExperience,
        removeExperience,
        addEducation,
        updateEducation,
        removeEducation,
        addSkill,
        updateSkill,
        removeSkill,
        updateSummary,
        setPaymentStatus,
        setDraftId,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};
