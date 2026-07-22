import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Resume } from '../types/resume';

// Register fonts for PDF generation
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@0.0.4/dist/standard_fonts/Helvetica.ttf' },
  ],
});

Font.register({
  family: 'Times',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@0.0.4/dist/standard_fonts/Times-Roman.ttf' },
  ],
});

interface ResumePDFProps {
  resume: Resume;
  font?: 'Helvetica' | 'Times';
  accentColor?: '#000000' | '#1E3A8A' | '#374151';
}

const createStyles = (font: string, accentColor: string) => StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: font,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: accentColor,
    paddingBottom: 16,
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
    color: '#000000',
  },
  contactInfo: {
    fontSize: 10,
    marginBottom: 4,
    color: '#000000',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: accentColor,
    paddingBottom: 4,
    color: accentColor,
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
  languageItem: {
    fontSize: 10,
    marginBottom: 2,
  },
});

const ResumePDF: React.FC<ResumePDFProps> = ({ resume, font = 'Helvetica', accentColor = '#000000' }) => {
  const { personalInfo, experience, education, skills, languages, summary } = resume;
  const styles = createStyles(font, accentColor);

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
            {[personalInfo.email, personalInfo.phone].filter(Boolean).join(' | ')}
          </Text>
          <Text style={styles.contactInfo}>
            {[
              personalInfo.address,
              personalInfo.number ? `Nº ${personalInfo.number}` : null,
              personalInfo.complement,
              personalInfo.neighborhood,
              personalInfo.city,
              personalInfo.state,
              personalInfo.zipCode ? `CEP: ${personalInfo.zipCode}` : null,
            ].filter(Boolean).join(', ')}
          </Text>
          <Text style={styles.contactInfo}>
            {[personalInfo.linkedin, personalInfo.website].filter(Boolean).join(' | ')}
          </Text>
        </View>

        {/* Summary */}
        {summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Objetivo Profissional</Text>
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
            <Text style={styles.sectionTitle}>Habilidades e Competências</Text>
            <Text style={styles.skills}>{skills.map((skill) => skill.name).join(' • ')}</Text>
          </View>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Idiomas</Text>
            {languages.map((lang, index) => (
              <Text key={index} style={styles.languageItem}>
                {lang.name} ({lang.proficiency})
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default ResumePDF;
