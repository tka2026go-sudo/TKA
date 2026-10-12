import { Question, ExamScoreResult } from '../types';

export function gradeExamSession(
  questions: Question[],
  studentAnswers: Record<string, any>
): ExamScoreResult {
  let totalScore = 0;
  let maxScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;

  const breakdown = questions.map((q) => {
    const qMax = q.skorMaksimal || 1;
    maxScore += qMax;

    const answer = studentAnswers[q.idSoal];
    let earned = 0;
    let isCorrect = false;

    if (q.bentukSoal === 'PG') {
      const correctOpt = (q.kunciTerstruktur?.correct || q.kunciJawaban || '').trim().toUpperCase();
      const studentOpt = (typeof answer === 'string' ? answer : '').trim().toUpperCase();
      if (studentOpt && studentOpt === correctOpt) {
        earned = qMax;
        isCorrect = true;
      }
    } else if (q.bentukSoal === 'PGK-MCMA') {
      let correctSet: string[] = [];
      if (Array.isArray(q.kunciTerstruktur?.correct)) {
        correctSet = q.kunciTerstruktur.correct.map((x: string) => x.trim().toUpperCase());
      } else if (typeof q.kunciJawaban === 'string') {
        correctSet = q.kunciJawaban.split(',').map(x => x.trim().toUpperCase()).filter(Boolean);
      }

      let studentSet: string[] = [];
      if (Array.isArray(answer)) {
        studentSet = answer.map((x: string) => x.trim().toUpperCase());
      } else if (typeof answer === 'string' && answer) {
        studentSet = answer.split(',').map(x => x.trim().toUpperCase()).filter(Boolean);
      }

      // Check match
      const correctSorted = [...new Set(correctSet)].sort();
      const studentSorted = [...new Set(studentSet)].sort();

      if (correctSorted.length > 0 && studentSorted.length > 0) {
        // Calculate matched elements
        let correctMatches = 0;
        let incorrectPicks = 0;
        studentSorted.forEach(val => {
          if (correctSorted.includes(val)) {
            correctMatches++;
          } else {
            incorrectPicks++;
          }
        });

        if (correctSorted.join(',') === studentSorted.join(',')) {
          earned = qMax;
          isCorrect = true;
        } else if (correctMatches > 0 && incorrectPicks === 0) {
          // Partial credit
          earned = Number(((correctMatches / correctSorted.length) * qMax).toFixed(2));
          isCorrect = false;
        }
      }
    } else if (q.bentukSoal === 'PGK-Kategori') {
      const correctMap = q.kunciTerstruktur || {};
      const studentMap = (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) ? answer : {};

      const statementKeys = ['1', '2', '3'];
      let matchedCount = 0;
      let totalStatements = 0;

      statementKeys.forEach(k => {
        const correctVal = (correctMap[k] || '').trim().toLowerCase();
        if (correctVal) {
          totalStatements++;
          const studentVal = (studentMap[k] || '').trim().toLowerCase();
          if (studentVal && studentVal === correctVal) {
            matchedCount++;
          }
        }
      });

      if (totalStatements > 0) {
        earned = Number(((matchedCount / totalStatements) * qMax).toFixed(2));
        if (matchedCount === totalStatements) {
          isCorrect = true;
        }
      }
    }

    if (isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }
    totalScore += earned;

    return {
      questionId: q.idSoal,
      earnedScore: earned,
      maxScore: qMax,
      isCorrect,
      studentAnswer: answer ?? null,
      correctAnswer: q.kunciTerstruktur || q.kunciJawaban,
    };
  });

  const percentage = maxScore > 0 ? Number(((totalScore / maxScore) * 100).toFixed(1)) : 0;

  return {
    totalScore: Number(totalScore.toFixed(2)),
    maxScore,
    percentage,
    correctCount,
    incorrectCount,
    breakdown,
  };
}
