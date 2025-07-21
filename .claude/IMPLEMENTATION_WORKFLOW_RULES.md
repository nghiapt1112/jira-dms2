# Claude Code Implementation Workflow Rules
*Mandatory workflow for all Claude Code implementations*

## 🎯 **MANDATORY WORKFLOW ENFORCEMENT**

### **Rule 1: Plan-First Development**
**ALWAYS create a comprehensive plan before ANY coding task**

- **Location**: `doc/dashboard/plan/[Feature-Name]-Implementation-Plan.md`
- **Trigger**: Every implementation task, no matter how small
- **Template**: Use standardized plan template (see below)
- **Enforcement**: Claude Code will refuse to proceed without a plan

### **Rule 2: Review-Driven Quality**
**ALWAYS use ultrathink to review against the plan**

- **Maximum**: 4 review cycles per implementation
- **Requirement**: Review after every major implementation step
- **Documentation**: Update plan with review findings
- **Enforcement**: Break workflow after 4 cycles with user warning

### **Rule 3: Plan Documentation**
**ALWAYS maintain living documentation**

- **Update**: Plan must be updated if implementation deviates
- **Track**: All decisions and changes must be documented
- **Archive**: Completed plans serve as knowledge base
- **Enforcement**: Plan completion required before task closure

---

## 🔄 **WORKFLOW EXECUTION STEPS**

### **Step 1: Plan Creation (MANDATORY)**
```markdown
1. Create: doc/dashboard/plan/[Feature-Name]-Implementation-Plan.md
2. Use template sections:
   - Executive Summary
   - Problem Analysis  
   - Solution Design
   - Implementation Steps
   - Testing Strategy
   - Review Criteria
   - Timeline
   - Rollback Plan
   - Review Log
   - Final Status
3. Get user approval before proceeding
```

### **Step 2: Implementation Execution**
```markdown
1. Follow plan step-by-step
2. Use TodoWrite to track progress
3. Mark plan checklist items as completed
4. Document any deviations from plan
5. Never skip planned steps without updating plan
```

### **Step 3: Ultrathink Review (MAX 4 CYCLES)**
```markdown
Review Cycle X/4:
1. Analyze: What was implemented vs what was planned
2. Assess: Code quality, performance, user impact
3. Identify: Issues, improvements, missing elements
4. Update: Plan with findings and next actions
5. Decision: Continue, complete, or escalate
```

### **Step 4: Plan Updates (IF ISSUES FOUND)**
```markdown
1. Document issues in plan Review Log
2. Update implementation steps if needed
3. Adjust scope, timeline, or approach
4. Re-execute modified plan
5. Continue review cycle
```

### **Step 5: Cycle Limit Safety (AUTOMATIC)**
```markdown
If 4 cycles reached and issues remain:
1. STOP implementation
2. Document current state
3. List remaining issues
4. Warn user about cycle limit
5. Request user decision to proceed
```

---

## 📋 **PLAN TEMPLATE (MANDATORY)**

### **File Naming Convention**
```
doc/dashboard/plan/[Feature-Name]-Implementation-Plan.md

Examples:
- User-Authentication-Implementation-Plan.md
- API-Performance-Optimization-Implementation-Plan.md
- Chart-Migration-Implementation-Plan.md
```

### **Required Template Structure**
```markdown
# [Feature Name] Implementation Plan

## 1. Executive Summary
- Brief problem statement
- Solution overview
- Key deliverables
- Success criteria

## 2. Problem Analysis
- Current state assessment
- Issues identified
- Requirements gathered
- Constraints and limitations

## 3. Solution Design
- Architecture decisions
- Component structure
- Data flow design
- Integration points

## 4. Implementation Steps
- [ ] Step 1: Detailed action with acceptance criteria
- [ ] Step 2: Detailed action with acceptance criteria
- [ ] Step 3: Detailed action with acceptance criteria
- [ ] ...

## 5. Testing Strategy
- Unit testing requirements
- Integration testing plan
- User acceptance criteria
- Performance benchmarks

## 6. Review Criteria
- Code quality standards
- Performance requirements
- User experience validation
- Security considerations

## 7. Timeline
- Estimated completion time
- Key milestones
- Dependencies
- Risk buffer

## 8. Rollback Plan
- Rollback triggers
- Rollback procedures
- Risk mitigation strategies
- Recovery timeline

## 9. Review Log
### Cycle 1/4 - [Date]
**Status**: [in_progress|issues_found|completed]
**Issues**: [List any issues found]
**Actions**: [Actions taken to address issues]

### Cycle 2/4 - [Date]
**Status**: [in_progress|issues_found|completed]
**Issues**: [List any issues found]
**Actions**: [Actions taken to address issues]

### Cycle 3/4 - [Date]
**Status**: [in_progress|issues_found|completed]
**Issues**: [List any issues found]
**Actions**: [Actions taken to address issues]

### Cycle 4/4 - [Date]
**Status**: [completed|escalated]
**Issues**: [List any remaining issues]
**Decision**: [Final decision on completion]

## 10. Final Status
- [ ] All implementation steps completed
- [ ] All tests passing
- [ ] Performance requirements met
- [ ] User acceptance criteria satisfied
- [ ] Documentation complete
- [ ] Rollback plan validated

**Status**: [COMPLETED|ESCALATED]
**Quality Score**: [1-10]
**User Impact**: [High|Medium|Low]
**Technical Debt**: [None|Minimal|Moderate|High]
```

---

## 🚨 **ENFORCEMENT MECHANISMS**

### **Automatic Workflow Enforcement**
Claude Code will automatically:
1. **Refuse to code** without a plan file
2. **Prompt for plan creation** if missing
3. **Track review cycles** and enforce 4-cycle limit
4. **Warn about cycle limits** and request user input
5. **Validate plan completeness** before task closure

### **Review Cycle Tracking**
```javascript
// Internal cycle tracking (conceptual)
const workflowState = {
  planFile: null,
  currentCycle: 0,
  maxCycles: 4,
  status: 'not_started', // not_started, planning, implementing, reviewing, completed, escalated
  issues: [],
  reviewLog: []
};
```

### **Cycle Limit Warning Template**
```markdown
⚠️ **WORKFLOW CYCLE LIMIT REACHED** ⚠️

After 4 review cycles, implementation still has outstanding issues.

**Current Status:**
- Plan file: [plan-file-path]
- Completed: [list successful implementations]
- Issues: [list remaining issues]
- Quality score: [current score]

**Options:**
1. Accept current implementation (with documented issues)
2. Extend review cycles manually (user approval required)
3. Redesign approach with new plan
4. Escalate to senior developer/architect

**User Decision Required:** Please specify how to proceed.
```

---

## 📊 **WORKFLOW INTEGRATION**

### **Integration with Existing .claude Structure**
```
.claude/
├── IMPLEMENTATION_WORKFLOW_RULES.md     # This file (mandatory rules)
├── CLAUDE_CODE_WORKFLOW.md             # Existing workflow (enhanced)
├── conventions.md                       # Code conventions (unchanged)
├── settings.local.json                 # Settings (add workflow config)
└── templates/                          # Add plan templates
    └── implementation-plan-template.md
```

### **Settings Configuration**
Add to `.claude/settings.local.json`:
```json
{
  "workflow": {
    "enforceImplementationRules": true,
    "maxReviewCycles": 4,
    "planDirectory": "doc/dashboard/plan",
    "requirePlanApproval": true,
    "autoTrackCycles": true
  }
}
```

### **Integration with TodoWrite**
```markdown
TodoWrite integration:
1. Create plan file → TodoWrite: "Create implementation plan"
2. Start implementation → TodoWrite: "Begin implementation phase"
3. Review cycle → TodoWrite: "Review cycle X/4 completed"
4. Plan updates → TodoWrite: "Update plan with review findings"
5. Completion → TodoWrite: "Implementation completed successfully"
```

---

## 🎯 **AUTOMATIC ENFORCEMENT EXAMPLES**

### **Example 1: User Requests Feature**
```
User: "Add user authentication to the dashboard"

Claude Response:
"I need to create an implementation plan first. Creating:
doc/dashboard/plan/User-Authentication-Implementation-Plan.md

[Creates plan file using template]

Please review this plan before I begin implementation."
```

### **Example 2: Review Cycle Limit**
```
After 4 review cycles:

Claude Response:
"⚠️ WORKFLOW CYCLE LIMIT REACHED ⚠️

After 4 review cycles, the authentication implementation still has:
- Password validation needs strengthening
- Email verification integration incomplete

Completed successfully:
- Login/logout functionality
- Session management
- Basic user registration

Options:
1. Accept current implementation (document remaining issues)
2. Extend cycles manually (requires your approval)
3. Create new plan for remaining items

Please specify how to proceed."
```

### **Example 3: Plan Deviation**
```
During implementation:

Claude Response:
"I notice the implementation is deviating from the plan. The original plan called for JWT tokens, but the current database schema suggests session-based auth.

I need to update the plan to reflect this change:
- Update Section 3: Solution Design
- Modify Section 4: Implementation Steps
- Add note to Section 9: Review Log

Should I proceed with updating the plan?"
```

---

## 🏆 **SUCCESS METRICS**

### **Workflow Compliance**
- **100% plan coverage**: Every implementation has a plan
- **4-cycle limit**: No implementation exceeds review cycles
- **Quality improvement**: Average quality score >8/10
- **User satisfaction**: Reduced rework and better outcomes

### **Process Benefits**
- **Reduced rework**: Comprehensive planning prevents issues
- **Better documentation**: Living plans serve as knowledge base
- **Quality assurance**: Systematic reviews catch problems early
- **Risk mitigation**: Rollback plans reduce deployment risk

### **Team Benefits**
- **Consistency**: Standardized approach across all implementations
- **Knowledge sharing**: Plans become reusable templates
- **Mentoring**: Review cycles provide learning opportunities
- **Accountability**: Clear criteria for completion

---

## 🔗 **WORKFLOW ACTIVATION**

### **Immediate Activation**
This workflow is **ACTIVE IMMEDIATELY** for all Claude Code implementations.

### **Grandfathering**
- **Existing implementations**: Continue without disruption
- **New implementations**: Must follow workflow rules
- **Partial implementations**: Complete with review cycles

### **User Override**
Users can override workflow rules by explicitly stating:
```
"Skip workflow rules for this quick fix"
```
But this should be rare and documented.

---

## 📚 **QUICK REFERENCE**

### **Before Starting ANY Implementation**
1. ✅ Create plan file: `doc/dashboard/plan/[Feature]-Implementation-Plan.md`
2. ✅ Use template structure (10 sections)
3. ✅ Get user approval
4. ✅ Set up TodoWrite tracking

### **During Implementation**
1. ✅ Follow plan step-by-step
2. ✅ Update plan if deviations occur
3. ✅ Document progress in TodoWrite
4. ✅ Conduct review cycles as needed

### **After Implementation**
1. ✅ Complete final review cycle
2. ✅ Update plan with final status
3. ✅ Ensure all acceptance criteria met
4. ✅ Archive completed plan

---

**These workflow rules are MANDATORY for all Claude Code implementations and will be automatically enforced.** 🚀

*Version: 1.0*
*Effective: Immediately*
*Last Updated: 2025-01-18*