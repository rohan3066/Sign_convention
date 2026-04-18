package com.sign.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sign.model.RecognitionSign;
import com.sign.repository.RecognitionSignRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DTWService {

    @Autowired
    private RecognitionSignRepository recognitionSignRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public record MatchResult(String word, double confidence) {}

    public MatchResult matchSign(List<List<double[]>> inputSequence) {
        if (inputSequence == null || inputSequence.size() < 10) {
            return new MatchResult("Too Short", 0.0);
        }

        double[][] inputMotion = getMotionFeatures(inputSequence);
        if (inputMotion.length < 5) {
            return new MatchResult("No Motion", 0.0);
        }

        List<RecognitionSign> allSigns = recognitionSignRepository.findAll();
        List<Map.Entry<Double, String>> candidates = new ArrayList<>();

        for (RecognitionSign sign : allSigns) {
            try {
                List<List<double[]>> template = objectMapper.readValue(sign.getFrames(), new TypeReference<List<List<double[]>>>() {});
                if (template.size() < 5) continue;

                double[][] tempMotion = getMotionFeatures(template);
                if (tempMotion.length < 5) continue;

                double dist = dtwDistance(inputMotion, tempMotion);
                double normDist = dist / (inputMotion.length + tempMotion.length);
                candidates.add(new AbstractMap.SimpleEntry<>(normDist, sign.getWord()));
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Group by word and take the best distance for each word
        Map<String, Double> bestDistPerWord = candidates.stream()
                .collect(Collectors.toMap(
                        Map.Entry::getValue,
                        Map.Entry::getKey,
                        Math::min
                ));

        List<Map.Entry<String, Double>> sortedCandidates = bestDistPerWord.entrySet().stream()
                .sorted(Map.Entry.comparingByValue())
                .collect(Collectors.toList());

        if (sortedCandidates.isEmpty()) return new MatchResult("Not Found", 0.0);

        Map.Entry<String, Double> best = sortedCandidates.get(0);
        double confidence = Math.max(0.0, 1.0 - best.getValue() * 2) * 100;
        
        return new MatchResult(best.getKey(), confidence);
    }

    private double[][] getMotionFeatures(List<List<double[]>> sequence) {
        double[][] seqNorm = normalizeSequence(sequence);
        if (seqNorm.length < 2) return new double[0][0];

        // Simple smoothing and diff
        int w = 3;
        double[][] smoothed = new double[seqNorm.length][seqNorm[0].length];
        for (int i = 0; i < seqNorm.length; i++) {
            int start = Math.max(0, i - w + 1);
            int count = i - start + 1;
            for (int k = 0; k < seqNorm[0].length; k++) {
                double sum = 0;
                for (int j = start; j <= i; j++) {
                    sum += seqNorm[j][k];
                }
                smoothed[i][k] = sum / count;
            }
        }

        double[][] diff = new double[smoothed.length - 1][smoothed[0].length];
        for (int i = 0; i < diff.length; i++) {
            for (int k = 0; k < diff[0].length; k++) {
                diff[i][k] = smoothed[i + 1][k] - smoothed[i][k];
            }
        }
        return diff;
    }

    private double[][] normalizeSequence(List<List<double[]>> sequence) {
        List<double[]> normalized = new ArrayList<>();
        for (List<double[]> frame : sequence) {
            double[] pts = flattenFrame(frame);
            if (isAllZero(pts)) continue;

            double[] p11 = frame.get(11);
            double[] p12 = frame.get(12);

            double[] center;
            double scale;

            if (p11[0] == 0 && p12[0] == 0) {
                center = calculateMean(frame);
                scale = 1.0;
            } else {
                center = new double[]{(p11[0] + p12[0]) / 2.0, (p11[1] + p12[1]) / 2.0};
                scale = Math.sqrt(Math.pow(p11[0] - p12[0], 2) + Math.pow(p11[1] - p12[1], 2));
                if (scale < 0.01) scale = 1.0;
            }

            // Extract relevant indices: 11,12,13,14,15,16 and 33-74
            int[] relevantIndices = {11, 12, 13, 14, 15, 16};
            List<Double> features = new ArrayList<>();
            for (int idx : relevantIndices) {
                double[] p = frame.get(idx);
                features.add((p[0] - center[0]) / scale);
                features.add((p[1] - center[1]) / scale);
            }
            for (int i = 33; i < 75; i++) {
                double[] p = frame.get(i);
                features.add((p[0] - center[0]) / scale);
                features.add((p[1] - center[1]) / scale);
            }

            double[] featureArr = new double[features.size()];
            for (int i = 0; i < features.size(); i++) featureArr[i] = features.get(i);
            normalized.add(featureArr);
        }
        return normalized.toArray(new double[0][0]);
    }

    private double[] flattenFrame(List<double[]> frame) {
        double[] flat = new double[frame.size() * 2];
        for (int i = 0; i < frame.size(); i++) {
            flat[i * 2] = frame.get(i)[0];
            flat[i * 2 + 1] = frame.get(i)[1];
        }
        return flat;
    }

    private boolean isAllZero(double[] pts) {
        for (double d : pts) if (d != 0) return false;
        return true;
    }

    private double[] calculateMean(List<double[]> frame) {
        double sumX = 0, sumY = 0;
        int count = 0;
        for (double[] p : frame) {
            if (p[0] != 0 || p[1] != 0) {
                sumX += p[0];
                sumY += p[1];
                count++;
            }
        }
        return count == 0 ? new double[]{0.5, 0.5} : new double[]{sumX / count, sumY / count};
    }

    private double dtwDistance(double[][] s1, double[][] s2) {
        int n = s1.length;
        int m = s2.length;
        if (Math.abs(n - m) > 25 && Math.min(n, m) < 10) return Double.POSITIVE_INFINITY;

        double[][] dtw = new double[n + 1][m + 1];
        for (double[] row : dtw) Arrays.fill(row, Double.POSITIVE_INFINITY);
        dtw[0][0] = 0;

        int w = Math.max(10, Math.abs(n - m));
        for (int i = 1; i <= n; i++) {
            for (int j = Math.max(1, i - w); j <= Math.min(m, i + w); j++) {
                double cost = euclideanDistance(s1[i - 1], s2[j - 1]);
                dtw[i][j] = cost + Math.min(Math.min(dtw[i - 1][j], dtw[i][j - 1]), dtw[i - 1][j - 1]);
            }
        }
        return dtw[n][m];
    }

    private double euclideanDistance(double[] p1, double[] p2) {
        double sum = 0;
        for (int i = 0; i < p1.length; i++) {
            sum += Math.pow(p1[i] - p2[i], 2);
        }
        return Math.sqrt(sum);
    }
}
