/**
 * Demo Logger - Clean, investor-ready logging for demonstrations
 */
export class DemoLogger {
  private static instance: DemoLogger;
  private currentPhase: string = '';
  private phaseStartTime: number = 0;
  
  static getInstance(): DemoLogger {
    if (!DemoLogger.instance) {
      DemoLogger.instance = new DemoLogger();
    }
    return DemoLogger.instance;
  }

  /**
   * Start a major phase with clean visual separator
   */
  startPhase(phase: string, description: string) {
    this.currentPhase = phase;
    this.phaseStartTime = Date.now();
    
    console.log('\n' + '═'.repeat(60));
    console.log(`🎯 PHASE ${phase}: ${description}`);
    console.log('═'.repeat(60));
  }

  /**
   * Complete current phase with timing
   */
  completePhase(result?: string) {
    const duration = Date.now() - this.phaseStartTime;
    const status = result || 'COMPLETE';
    console.log(`✅ Phase ${this.currentPhase} ${status} (${duration}ms)`);
    console.log('═'.repeat(60) + '\n');
  }

  /**
   * Log a step within the current phase
   */
  step(message: string, details?: string) {
    console.log(`   ${message}`);
    if (details) {
      console.log(`   └─ ${details}`);
    }
  }

  /**
   * Log progress with visual indicator
   */
  progress(current: number, total: number, item: string) {
    const percentage = Math.round((current / total) * 100);
    const progressBar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
    console.log(`   [${progressBar}] ${percentage}% - ${item}`);
  }

  /**
   * Log a key result or metric
   */
  metric(label: string, value: string | number, unit?: string) {
    const displayValue = unit ? `${value} ${unit}` : value;
    console.log(`   📊 ${label}: ${displayValue}`);
  }

  /**
   * Log a decision or recommendation
   */
  decision(message: string, confidence?: number) {
    const confidenceStr = confidence ? ` (${Math.round(confidence * 100)}% confidence)` : '';
    console.log(`   🎯 ${message}${confidenceStr}`);
  }

  /**
   * Log a warning or important note
   */
  warning(message: string) {
    console.log(`   ⚠️  ${message}`);
  }

  /**
   * Log an error
   */
  error(message: string) {
    console.log(`   ❌ ${message}`);
  }

  /**
   * Log a success message
   */
  success(message: string) {
    console.log(`   ✅ ${message}`);
  }

  /**
   * Show a summary of results
   */
  summary(title: string, items: Array<{label: string, value: string | number}>) {
    console.log(`\n📋 ${title}:`);
    items.forEach(item => {
      console.log(`   • ${item.label}: ${item.value}`);
    });
    console.log('');
  }

  /**
   * Show the agent workflow overview
   */
  showWorkflowOverview() {
    console.log('\n' + '🚀 TWEAQ INTELLIGENT CODING AGENT'.padStart(40));
    console.log('━'.repeat(60));
    console.log('   Phase 1: Analyze visual changes and understand intent');
    console.log('   Phase 2: Assess impact and generate preservation rules');  
    console.log('   Phase 3: Determine confidence and select strategy');
    console.log('   Phase 4: Execute changes with intelligent validation');
    console.log('   Phase 5: Generate summary and create pull request');
    console.log('━'.repeat(60) + '\n');
  }
}

// Export singleton instance
export const demoLogger = DemoLogger.getInstance();
