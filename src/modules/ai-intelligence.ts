/**
 * AI Intelligence Module
 * Handles semantic analysis, trend detection, and predictions
 */

export interface SemanticAnalysis {
  intent: string;
  entities: Entity[];
  context: string;
  confidence: number;
}

export interface Entity {
  type: 'date' | 'category' | 'metric' | 'action' | 'comparison';
  value: string;
  confidence: number;
}

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable';
  slope: number;
  dataPoints: number;
  period: string;
  confidence: number;
}

export interface Prediction {
  metric: string;
  predictedValue: number;
  confidence: number;
  timeframe: string;
  factors: string[];
}

export interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: Date;
  value?: number;
  threshold?: number;
}

export class AIIntelligence {
  /**
   * Perform semantic analysis on input text
   */
  analyzeSemantics(text: string): SemanticAnalysis {
    const entities = this.extractEntities(text);
    const intent = this.determineIntent(text);
    const confidence = this.calculateConfidence(entities);

    return {
      intent,
      entities,
      context: text,
      confidence,
    };
  }

  /**
   * Extract entities from text
   */
  private extractEntities(text: string): Entity[] {
    const entities: Entity[] = [];

    // Date patterns
    const datePattern = /\b(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|today|yesterday|this week|last month)\b/gi;
    const dateMatches = text.match(datePattern);
    if (dateMatches) {
      dateMatches.forEach((match) => {
        entities.push({
          type: 'date',
          value: match,
          confidence: 0.95,
        });
      });
    }

    // Metric patterns
    const metricPattern = /\b(leads|revenue|conversion|sales|contacts|deals|leads generated)\b/gi;
    const metricMatches = text.match(metricPattern);
    if (metricMatches) {
      metricMatches.forEach((match) => {
        entities.push({
          type: 'metric',
          value: match,
          confidence: 0.85,
        });
      });
    }

    return entities;
  }

  /**
   * Determine intent from text
   */
  private determineIntent(text: string): string {
    const lowerText = text.toLowerCase();

    if (
      lowerText.includes('compare') ||
      lowerText.includes('difference') ||
      lowerText.includes('vs')
    ) {
      return 'comparison';
    }

    if (
      lowerText.includes('trend') ||
      lowerText.includes('growth') ||
      lowerText.includes('increase')
    ) {
      return 'trend_analysis';
    }

    if (lowerText.includes('predict') || lowerText.includes('forecast')) {
      return 'prediction';
    }

    if (
      lowerText.includes('anomal') ||
      lowerText.includes('unusual') ||
      lowerText.includes('unexpected')
    ) {
      return 'anomaly_detection';
    }

    return 'general_query';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(entities: Entity[]): number {
    if (entities.length === 0) return 0.5;

    const avgConfidence =
      entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
    return Math.min(avgConfidence, 0.95);
  }

  /**
   * Analyze trends in data
   */
  analyzeTrends(data: number[], period: string = 'daily'): TrendAnalysis {
    if (data.length < 2) {
      return {
        trend: 'stable',
        slope: 0,
        dataPoints: data.length,
        period,
        confidence: 0.3,
      };
    }

    const slope = this.calculateSlope(data);
    const trend =
      slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';

    const confidence = Math.min(Math.abs(slope) * 2, 0.95);

    return {
      trend,
      slope,
      dataPoints: data.length,
      period,
      confidence,
    };
  }

  /**
   * Calculate linear regression slope
   */
  private calculateSlope(data: number[]): number {
    if (data.length < 2) return 0;

    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  }

  /**
   * Predict future values based on historical data
   */
  predict(data: number[], timeframe: string = 'next_week'): Prediction {
    const trend = this.analyzeTrends(data);
    const slope = trend.slope;
    const lastValue = data[data.length - 1];

    // Simple linear extrapolation
    const periods = this.getPeriodCount(timeframe);
    const predictedValue = lastValue + slope * periods;

    const factors = [];
    if (trend.trend === 'increasing') factors.push('upward_trend');
    if (trend.trend === 'decreasing') factors.push('downward_trend');
    if (data.length < 10) factors.push('limited_historical_data');

    return {
      metric: 'estimated_value',
      predictedValue: Math.max(0, predictedValue),
      confidence: trend.confidence * 0.8,
      timeframe,
      factors,
    };
  }

  /**
   * Detect anomalies in data
   */
  detectAnomalies(data: number[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    if (data.length < 3) return anomalies;

    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const stdDev = Math.sqrt(
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
    );

    data.forEach((value, index) => {
      const zScore = Math.abs((value - mean) / stdDev);

      if (zScore > 3) {
        anomalies.push({
          type: 'statistical_outlier',
          severity: 'high',
          description: `Value ${value} is ${zScore.toFixed(2)} standard deviations from mean`,
          timestamp: new Date(),
          value,
          threshold: mean + 3 * stdDev,
        });
      } else if (zScore > 2) {
        anomalies.push({
          type: 'potential_anomaly',
          severity: 'medium',
          description: `Value ${value} is ${zScore.toFixed(2)} standard deviations from mean`,
          timestamp: new Date(),
          value,
          threshold: mean + 2 * stdDev,
        });
      }
    });

    return anomalies;
  }

  /**
   * Get period count for timeframe
   */
  private getPeriodCount(timeframe: string): number {
    const map: Record<string, number> = {
      next_day: 1,
      next_week: 7,
      next_month: 30,
      next_quarter: 90,
      next_year: 365,
    };
    return map[timeframe] || 7;
  }
}

// Singleton instance
export const aiIntelligence = new AIIntelligence();
