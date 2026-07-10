import { z } from 'zod'

export const personalInfoSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  address: z.string().min(2, 'Endereço deve ter pelo menos 2 caracteres'),
  linkedin: z.string().optional(),
  website: z.string().optional(),
})

export const experienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(2, 'Empresa deve ter pelo menos 2 caracteres'),
  position: z.string().min(2, 'Cargo deve ter pelo menos 2 caracteres'),
  startDate: z.string().min(5, 'Data de início inválida'),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
})

export const educationSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(2, 'Instituição deve ter pelo menos 2 caracteres'),
  degree: z.string().min(2, 'Grau deve ter pelo menos 2 caracteres'),
  field: z.string().min(2, 'Área deve ter pelo menos 2 caracteres'),
  startDate: z.string().min(5, 'Data de início inválida'),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
})

export const skillSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Habilidade deve ter pelo menos 2 caracteres'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
})

export const resumeSchema = z.object({
  personalInfo: personalInfoSchema,
  experience: z.array(experienceSchema).min(1, 'Adicione pelo menos uma experiência'),
  education: z.array(educationSchema).optional(),
  skills: z.array(skillSchema).min(1, 'Adicione pelo menos uma habilidade'),
  summary: z.string().min(20, 'Resumo deve ter pelo menos 20 caracteres'),
})
