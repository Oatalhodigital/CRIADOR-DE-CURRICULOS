import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Resume } from '../types/resume';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingBottom: 16,
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  contactInfo: {
    fontSize: 10,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingBottom: 4,
  },
  section: {
    marginBottom: 20,
  },
  experienceItem: {
    marginBottom: 12,
  },
  company: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  position: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  date: {
    fontSize: 10,
    marginBottom: 2,
  },
  description: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  educationItem: {
    marginBottom: 8,
  },
  institution: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  degree: {
    fontSize: 10,
  },
  skills: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.4,
  },
});

interface ResumePDFProps {
  resume: Resume;
}

const ResumePDF: React.FC<ResumePDFProps> = ({ resume }) => {
  const { personalInfo, experience, education, skills, summary } = resume;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month] = dateString.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[parseInt(month) - 1] + ' ' + year;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo.fullName || 'SEU NOME'}</Text>
          <Text style={styles.contactInfo}>
            {[personalInfo.email, personalInfo.phone, personalInfo.address].filter(Boolean).join(' | ')}
          </Text>
          <Text style={styles.contactInfo}>
            {[personalInfo.linkedin, personalInfo.website].filter(Boolean).join(' | ')}
          </Text>
        </View>

        {/* Summary */}
        {summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumo Profissional</Text>
            <Text style={styles.summary}>{summary}</Text>
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experiência Profissional</Text>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.experienceItem}>
                <Text style={styles.company}>{exp.company}</Text>
                <Text style={styles.position}>{exp.position}</Text>
                <Text style={styles.date}>
                  {formatDate(exp.startDate)} - {exp.current ? 'Atual' : formatDate(exp.endDate || '')}
                </Text>
                <Text style={styles.description}>{exp.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Educação</Text>
            {education.map((edu) => (
              <View key={edu.id} style={styles.educationItem}>
                <Text style={styles.institution}>{edu.institution}</Text>
                <Text style={styles.degree}>
                  {edu.degree} em {edu.field}
                </Text>
                <Text style={styles.date}>
                  {formatDate(edu.startDate)} - {edu.current ? 'Atual' : formatDate(edu.endDate || '')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Habilidades</Text>
            <Text style={styles.skills}>{skills.map((skill) => skill.name).join(' • ')}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default ResumePDF;
