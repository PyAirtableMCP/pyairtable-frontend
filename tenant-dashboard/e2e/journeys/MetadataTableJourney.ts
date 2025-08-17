import { Page, expect } from '@playwright/test'
import { GeminiWorkspaceHelpers } from '../helpers/gemini-helpers'
import { LongRunningTestHelpers } from '../helpers/long-running-helpers'

/**
 * Complete Metadata Table Journey
 * Tests the full workflow of creating metadata tables, describing existing tables,
 * adding improvement columns, and populating improvements using Gemini AI.
 */
export class MetadataTableJourney {
  
  constructor(private page: Page) {}

  /**
   * Step 1: Create a metadata table through chat interface
   */
  async createMetadataTable(tableName: string = 'Social Media Posts'): Promise<string> {
    console.log('🏗️ Starting metadata table creation...')
    
    // Navigate to chat interface
    await this.page.goto('/chat')
    await this.page.waitForLoadState('networkidle')
    
    // Wait for chat interface to be ready
    await expect(this.page.getByText(/PyAirtable Assistant/i)).toBeVisible()
    
    // Request metadata table creation
    const createRequest = `I need you to create a metadata table for my "${tableName}" table. The metadata table should include:
    1. Table name and description
    2. Column definitions and purposes  
    3. Data relationships and dependencies
    4. Performance metrics and insights
    5. Improvement opportunities column
    
    Please create this as a new table in my Airtable base.`
    
    await this.page.getByPlaceholder(/ask anything about your data/i).fill(createRequest)
    await this.page.keyboard.press('Enter')
    
    // Wait for AI to process the request (long-running operation)
    await LongRunningTestHelpers.waitForAIProcessing(this.page, 120000)
    
    // Capture response and extract table information
    const response = await this.page.waitForSelector('.ai-response:last-child')
    const responseText = await response.textContent() || ''
    
    // Verify table creation confirmation
    expect(responseText).toMatch(/created|metadata table|new table/i)
    
    // Extract table ID or name from response
    const tableIdMatch = responseText.match(/table[:\s]+([a-zA-Z0-9_-]+)/i)
    const createdTableId = tableIdMatch ? tableIdMatch[1] : 'metadata_table'
    
    console.log('✅ Metadata table created:', createdTableId)
    return createdTableId
  }

  /**
   * Step 2: Describe existing tables in detail
   */
  async describeExistingTables(): Promise<string[]> {
    console.log('📋 Describing existing tables...')
    
    const describeRequest = `Please analyze and describe all my existing Airtable tables. For each table, provide:
    1. Table name and purpose
    2. Column structure and data types
    3. Number of records and data patterns
    4. Relationships to other tables
    5. Current usage and performance
    6. Data quality assessment
    
    Be comprehensive and detailed in your analysis.`
    
    await this.page.getByPlaceholder(/ask anything about your data/i).fill(describeRequest)
    await this.page.keyboard.press('Enter')
    
    // Wait for comprehensive analysis (this takes longer)
    await LongRunningTestHelpers.waitForAIProcessing(this.page, 180000)
    
    // Capture progress screenshot
    await LongRunningTestHelpers.captureProgressScreenshots(this.page, 'table-analysis')
    
    // Get the analysis response
    const analysisResponse = await this.page.waitForSelector('.ai-response:last-child')
    const analysisText = await analysisResponse.textContent() || ''
    
    // Verify comprehensive analysis was provided
    expect(analysisText).toMatch(/table|column|records|analysis/i)
    expect(analysisText.length).toBeGreaterThan(500) // Ensure detailed response
    
    // Extract table names from the analysis
    const tableNames = analysisText.match(/table[:\s]*([a-zA-Z0-9_\s-]+)/gi) || []
    
    console.log('✅ Analyzed tables:', tableNames.length)
    return tableNames
  }

  /**
   * Step 3: Add improvement column to metadata table
   */
  async addImprovementColumn(metadataTableId: string): Promise<void> {
    console.log('📊 Adding improvement column...')
    
    const columnRequest = `In the metadata table "${metadataTableId}", please add a new column called "Improvement Recommendations" with the following specifications:
    1. Column type: Long text (for detailed recommendations)
    2. Description: "AI-generated recommendations for optimizing this table's structure, performance, and data quality"
    3. Default formatting for readability
    
    Please also add a "Priority Level" column (Single select) with options: High, Medium, Low
    And an "Implementation Status" column (Single select) with options: Not Started, In Progress, Completed, Blocked`
    
    await this.page.getByPlaceholder(/ask anything about your data/i).fill(columnRequest)
    await this.page.keyboard.press('Enter')
    
    // Wait for column creation
    await LongRunningTestHelpers.waitForAIProcessing(this.page, 60000)
    
    // Verify column was added
    const columnResponse = await this.page.waitForSelector('.ai-response:last-child')
    const columnText = await columnResponse.textContent() || ''
    
    expect(columnText).toMatch(/column|added|improvement|recommendation/i)
    
    console.log('✅ Improvement columns added')
  }

  /**
   * Step 4: Populate improvement recommendations using Gemini's analysis
   */
  async populateImprovements(metadataTableId: string, tableNames: string[]): Promise<void> {
    console.log('🤖 Generating improvement recommendations...')
    
    const populateRequest = `Now I need you to populate the "Improvement Recommendations" column in the "${metadataTableId}" metadata table with specific, actionable recommendations for each of my tables. 

    For each table you analyzed earlier (${tableNames.slice(0, 5).join(', ')}, etc.), please provide:
    
    1. **Data Structure Improvements**: Column optimization, data type corrections, relationship enhancements
    2. **Performance Optimizations**: Indexing suggestions, query optimization, data organization
    3. **Data Quality Enhancements**: Validation rules, data cleansing opportunities, consistency improvements
    4. **Automation Opportunities**: Formula suggestions, automated workflows, integration possibilities
    5. **User Experience**: Better field names, descriptions, view configurations
    
    Please be specific and actionable. Include estimated impact and difficulty level for each recommendation.
    
    Also set appropriate Priority Levels based on impact and ease of implementation.`
    
    await this.page.getByPlaceholder(/ask anything about your data/i).fill(populateRequest)
    await this.page.keyboard.press('Enter')
    
    // This is the longest operation - Gemini analyzing all tables and generating recommendations
    await LongRunningTestHelpers.waitForAIProcessing(this.page, 300000) // 5 minutes max
    
    // Capture progress screenshots during processing
    await LongRunningTestHelpers.captureProgressScreenshots(this.page, 'improvement-generation')
    
    // Verify recommendations were generated
    const recommendationResponse = await this.page.waitForSelector('.ai-response:last-child')
    const recommendationText = await recommendationResponse.textContent() || ''
    
    expect(recommendationText).toMatch(/recommendation|improvement|populated|completed/i)
    expect(recommendationText.length).toBeGreaterThan(1000) // Ensure detailed recommendations
    
    console.log('✅ Improvement recommendations populated')
  }

  /**
   * Step 5: Leverage Gemini's Google Workspace integration
   */
  async integrateWithGoogleWorkspace(metadataTableId: string): Promise<string | null> {
    console.log('📊 Setting up Google Workspace integration...')
    
    // Setup Google Sheets integration if not already done
    await GeminiWorkspaceHelpers.setupGoogleSheetsIntegration(this.page)
    
    // Create a Google Sheet for project tracking
    const sheetRequest = `Create a Google Sheet that mirrors the metadata table "${metadataTableId}" with additional project management features:
    
    1. Import all improvement recommendations
    2. Add project management columns (Owner, Due Date, Progress %, Notes)
    3. Create charts showing improvement priority distribution
    4. Set up automated email notifications for due dates
    5. Generate executive summary dashboard
    
    Please create this sheet and share the link.`
    
    await this.page.getByPlaceholder(/ask anything about your data/i).fill(sheetRequest)
    await this.page.keyboard.press('Enter')
    
    // Wait for Google Sheets creation
    await LongRunningTestHelpers.waitForAIProcessing(this.page, 120000)
    
    const sheetResponse = await this.page.waitForSelector('.ai-response:last-child')
    const sheetText = await sheetResponse.textContent() || ''
    
    // Extract Google Sheets URL
    const sheetUrl = await GeminiWorkspaceHelpers.createMetadataSheet(this.page, metadataTableId)
    
    if (sheetUrl) {
      console.log('✅ Google Sheet created:', sheetUrl)
    }
    
    return sheetUrl
  }

  /**
   * Step 6: Generate visual analysis with Gemini's image generation
   */
  async generateVisualAnalysis(): Promise<void> {
    console.log('🎨 Generating visual analysis...')
    
    const visualRequest = `Create visual representations of my data improvement analysis:
    
    1. A flowchart showing table relationships and dependencies
    2. A priority matrix chart for improvement recommendations
    3. A timeline visualization for implementation planning
    4. Before/after comparison diagrams for key improvements
    5. An executive dashboard mockup
    
    Generate these as images that I can use in presentations.`
    
    await this.page.getByPlaceholder(/ask anything about your data/i).fill(visualRequest)
    await this.page.keyboard.press('Enter')
    
    // Wait for image generation (can be slow)
    await LongRunningTestHelpers.waitForAIProcessing(this.page, 180000)
    
    // Verify images were generated
    const images = await GeminiWorkspaceHelpers.generateImagesForData(
      this.page, 
      'metadata table improvement analysis'
    )
    
    const imageCount = await images.count()
    expect(imageCount).toBeGreaterThan(0)
    
    console.log('✅ Visual analysis generated:', imageCount, 'images')
  }

  /**
   * Step 7: Complete workflow validation
   */
  async validateCompleteWorkflow(): Promise<void> {
    console.log('✅ Validating complete workflow...')
    
    // Final validation request
    const validationRequest = `Please provide a comprehensive summary of what we've accomplished:
    
    1. Metadata table creation status
    2. Table analysis completion
    3. Improvement recommendations generated
    4. Google Workspace integration status  
    5. Visual analysis completion
    6. Next recommended steps
    
    Include any errors or issues that need attention.`
    
    await this.page.getByPlaceholder(/ask anything about your data/i).fill(validationRequest)
    await this.page.keyboard.press('Enter')
    
    await LongRunningTestHelpers.waitForAIProcessing(this.page, 60000)
    
    const validationResponse = await this.page.waitForSelector('.ai-response:last-child')
    const validationText = await validationResponse.textContent() || ''
    
    expect(validationText).toMatch(/summary|completed|status/i)
    
    console.log('🎉 Complete metadata table journey validated!')
  }

  /**
   * Execute the complete journey
   */
  async executeCompleteJourney(): Promise<{
    metadataTableId: string,
    analyzedTables: string[],
    googleSheetUrl: string | null,
    success: boolean
  }> {
    
    try {
      // Execute all steps in sequence
      const metadataTableId = await this.createMetadataTable()
      const analyzedTables = await this.describeExistingTables()
      await this.addImprovementColumn(metadataTableId)
      await this.populateImprovements(metadataTableId, analyzedTables)
      const googleSheetUrl = await this.integrateWithGoogleWorkspace(metadataTableId)
      await this.generateVisualAnalysis()
      await this.validateCompleteWorkflow()
      
      return {
        metadataTableId,
        analyzedTables,
        googleSheetUrl,
        success: true
      }
      
    } catch (error) {
      console.error('❌ Journey failed:', error)
      
      // Capture failure screenshot
      await this.page.screenshot({ 
        path: `test-results/metadata-journey-failure-${Date.now()}.png`,
        fullPage: true 
      })
      
      return {
        metadataTableId: '',
        analyzedTables: [],
        googleSheetUrl: null,
        success: false
      }
    }
  }
}