'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Resume, PersonalInfo, Experience, Education, Skill, Language } from '@/types/resume';
import { auth, db } from '@/lib/firebase';

interface ResumeContextType {
  resume: Resume;
  activeTemplate: 'classic' | 'modern' | 'minimalist';
  firebaseUser: User | null;
  firebaseReady: boolean;
  draftExperience: Partial<Experience> | null;
  draftEducation: Partial<Education> | null;
  draftSkill: Partial<Skill> | null;
  setActiveTemplate: (template: 'classic' | 'modern' | 'minimalist') => void;
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
  addLanguage: (language: Language) => void;
  updateLanguage: (id: string, language: Language) => void;
  removeLanguage: (id: string) => void;
  updateSummary: (summary: string) => void;
  setPaymentStatus: (paid: boolean, paymentId?: string) => void;
  setDraftId: (id: string) => void;
  setDraftExperience: (experience: Partial<Experience> | null) => void;
  setDraftEducation: (education: Partial<Education> | null) => void;
  setDraftSkill: (skill: Partial<Skill> | null) => void;
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

export const initialResume: Resume = {
  personalInfo: initialPersonalInfo,
  experience: [],
  education: [],
  skills: [],
  languages: [],
  summary: '',
  paid: false,
};

export const ResumeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [resume, setResume] = useState<Resume>(initialResume);
  const [activeTemplate, setActiveTemplate] = useState<'classic' | 'modern' | 'minimalist'>('modern');
  const [draftId, setDraftIdState] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(!auth);
  const [draftExperience, setDraftExperience] = useState<Partial<Experience> | null>(null);
  const [draftEducation, setDraftEducation] = useState<Partial<Education> | null>(null);
  const [draftSkill, setDraftSkill] = useState<Partial<Skill> | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Firebase Auth — anonymous sign-in
  useEffect(() => {
    if (!auth || !db) {
      setFirebaseReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        setFirebaseReady(true);
      } else {
        try {
          if (!auth) return;
          const credential = await signInAnonymously(auth);
          setFirebaseUser(credential.user);
        } catch (error) {
          console.error('Firebase auth failed:', error);
        } finally {
          setFirebaseReady(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const savedResume = localStorage.getItem('resumeDraft');
    if (savedResume) {
      try {
        const parsed = JSON.parse(savedResume);
        setResume({
          ...initialResume,
          ...parsed,
          personalInfo: { ...initialPersonalInfo, ...parsed.personalInfo },
          experience: parsed.experience ?? [],
          education: parsed.education ?? [],
          skills: parsed.skills ?? [],
          languages: parsed.languages ?? [],
          summary: parsed.summary ?? '',
        });
        if (parsed.id) {
          setDraftIdState(parsed.id);
        }
      } catch (error) {
        console.error('Failed to load saved resume:', error);
      }
    }
  }, []);

  // Auto-save to localStorage + Firestore
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (resume.personalInfo.email || resume.personalInfo.fullName) {
          localStorage.setItem('resumeDraft', JSON.stringify(resume));

          if (auth && db && firebaseUser && firebaseReady) {
            const id = resume.id || draftId || firebaseUser.uid;
            await setDoc(
              doc(db, 'resumes', id),
              {
                ...resume,
                id,
                userId: firebaseUser.uid,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
            if (!resume.id && !draftId) {
              setDraftIdState(id);
              setResume((prev) => ({ ...prev, id }));
            }
          }
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [resume, firebaseUser, firebaseReady, draftId]);

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

  const addLanguage = (language: Language) => {
    setResume(prev => ({
      ...prev,
      languages: [...prev.languages, language],
    }));
  };

  const updateLanguage = (id: string, language: Language) => {
    setResume(prev => ({
      ...prev,
      languages: prev.languages.map(lang => lang.id === id ? language : lang),
    }));
  };

  const removeLanguage = (id: string) => {
    setResume(prev => ({
      ...prev,
      languages: prev.languages.filter(lang => lang.id !== id),
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
        activeTemplate,
        firebaseUser,
        firebaseReady,
        draftExperience,
        draftEducation,
        draftSkill,
        setActiveTemplate,
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
        addLanguage,
        updateLanguage,
        removeLanguage,
        updateSummary,
        setPaymentStatus,
        setDraftId,
        setDraftExperience,
        setDraftEducation,
        setDraftSkill,
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
