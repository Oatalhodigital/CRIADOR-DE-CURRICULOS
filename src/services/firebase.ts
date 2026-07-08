import { db, COLLECTIONS, ADMIN_EMAIL } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { Resume } from '../types/resume';

// Save draft resume to Firestore
export const saveDraft = async (resumeData: Resume, userId?: string) => {
  try {
    const draftId = resumeData.id || `draft_${Date.now()}`;
    const draftRef = doc(db, COLLECTIONS.DRAFTS, draftId);
    
    await setDoc(draftRef, {
      ...resumeData,
      id: draftId,
      userId: userId || null,
      updatedAt: serverTimestamp(),
      createdAt: resumeData.createdAt || serverTimestamp(),
    });
    
    return draftId;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
};

// Get draft by ID
export const getDraft = async (draftId: string) => {
  try {
    const draftRef = doc(db, COLLECTIONS.DRAFTS, draftId);
    const draftSnap = await getDoc(draftRef);
    
    if (draftSnap.exists()) {
      return { id: draftSnap.id, ...draftSnap.data() } as Resume;
    }
    return null;
  } catch (error) {
    console.error('Error getting draft:', error);
    throw error;
  }
};

// Create transaction record
export const createTransaction = async (resumeId: string, userEmail: string, amount: number = 8.98) => {
  try {
    const transactionRef = doc(collection(db, COLLECTIONS.TRANSACTIONS));
    const transactionId = transactionRef.id;
    
    await setDoc(transactionRef, {
      id: transactionId,
      resumeId,
      userEmail,
      amount,
      status: 'pendente',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return transactionId;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

// Listen to transaction status changes
export const listenToTransaction = (transactionId: string, callback: (status: string) => void) => {
  const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, transactionId);
  
  const unsubscribe = onSnapshot(transactionRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback(data.status);
    }
  });
  
  return unsubscribe;
};

// Update transaction status
export const updateTransactionStatus = async (transactionId: string, status: 'pendente' | 'pago' | 'cancelado') => {
  try {
    const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, transactionId);
    await updateDoc(transactionRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

// Get admin metrics
export const getAdminMetrics = async () => {
  try {
    // Get all transactions
    const transactionsQuery = query(
      collection(db, COLLECTIONS.TRANSACTIONS),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const transactionsSnap = await getDocs(transactionsQuery);
    
    const transactions = transactionsSnap.docs.map(doc => doc.data());
    
    // Calculate metrics
    const paidTransactions = transactions.filter(t => t.status === 'pago');
    const totalRevenue = paidTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const conversionRate = transactions.length > 0 
      ? (paidTransactions.length / transactions.length) * 100 
      : 0;
    
    // Get all drafts
    const draftsQuery = query(
      collection(db, COLLECTIONS.DRAFTS),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const draftsSnap = await getDocs(draftsQuery);
    const totalDrafts = draftsSnap.size;
    
    return {
      totalRevenue,
      conversionRate,
      totalTransactions: transactions.length,
      paidTransactions: paidTransactions.length,
      totalDrafts,
      recentTransactions: transactions.slice(0, 10),
    };
  } catch (error) {
    console.error('Error getting admin metrics:', error);
    throw error;
  }
};

// Check if user is admin
export const isAdminUser = (email: string | null): boolean => {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
};
