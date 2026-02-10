# A2UI Implementation Examples & Architecture Guide

## Table of Contents
1. [ASPX Migration Example](#aspx-migration-example)
2. [JSP Migration Example](#jsp-migration-example)
3. [React Integration Example](#react-integration-example)
4. [Oracle OJet Integration Example](#oracle-ojet-integration-example)
5. [Data Flow Diagrams](#data-flow-diagrams)

---

## ASPX Migration Example

### Before: Legacy ASPX Page
```aspx
<!-- CustomerForm.aspx -->
<%@ Page Language="C#" AutoEventWireup="true" %>
<asp:GridView ID="GridView1" runat="server" 
    AutoGenerateColumns="False" 
    OnRowDataBound="GridView1_RowDataBound">
    <Columns>
        <asp:BoundField DataField="CustomerId" HeaderText="ID" />
        <asp:BoundField DataField="CustomerName" HeaderText="Name" />
        <asp:BoundField DataField="Email" HeaderText="Email" />
    </Columns>
</asp:GridView>

<asp:TextBox ID="TxtName" runat="server" />
<asp:Button ID="BtnSave" runat="server" Text="Save" OnClick="BtnSave_Click" />
```

**Code Behind (CustomerForm.aspx.cs):**
```csharp
public partial class CustomerForm : Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            LoadCustomers();
        }
    }
    
    private void LoadCustomers()
    {
        var customers = _customerService.GetAllCustomers();
        GridView1.DataSource = customers;
        GridView1.DataBind();
    }
    
    protected void BtnSave_Click(object sender, EventArgs e)
    {
        var customer = new Customer { Name = TxtName.Text };
        _customerService.SaveCustomer(customer);
    }
}
```

### After: A2UI + Modern Architecture

**Step 1: Extract Business Logic to REST API**

```csharp
// CustomerController.cs (ASP.NET Core API)
[ApiController]
[Route("api/[controller]")]
public class CustomerController : ControllerBase
{
    private readonly ICustomerService _service;
    
    [HttpGet]
    public IActionResult GetAllCustomers()
    {
        var customers = _service.GetAllCustomers();
        return Ok(new { customers });
    }
    
    [HttpPost]
    public IActionResult SaveCustomer([FromBody] Customer customer)
    {
        _service.SaveCustomer(customer);
        return Ok(new { success = true });
    }
}
```

**Step 2: Create A2UI Agent**

```python
# customer_agent.py (using Google ADK or similar)
from google.adk.agents.llm_agent import Agent
import requests

CUSTOMER_AGENT_INSTRUCTION = """
You are a customer management UI agent. When users ask you to show customers or create forms:
1. Fetch customer data from the API
2. Generate an A2UI response with customer list or form
3. Return ONLY A2UI JSON (no text explanation)

Available actions:
- List customers: Call GET /api/customer
- Save customer: Call POST /api/customer

A2UI SCHEMA:
[schema details...]
"""

def get_customers():
    response = requests.get("http://localhost:5000/api/customer")
    return response.json()

agent = Agent(
    model='gemini-2.5-flash',
    name="customer_agent",
    description="Customer management with A2UI",
    instruction=CUSTOMER_AGENT_INSTRUCTION,
    tools=[get_customers]
)
```

**Step 3: A2UI Agent Output Example**

Agent receives: "Show me all customers"

Agent returns:
```json
{
  "createSurface": {
    "surfaceId": "customer_list",
    "catalogId": "https://your-org.com/catalogs/standard.json",
    "rootComponentId": "root_container"
  }
}
```

followed by:

```json
{
  "updateComponents": [
    {
      "id": "root_container",
      "component": "Column",
      "children": ["customer_table", "action_buttons"]
    },
    {
      "id": "customer_table",
      "component": "Table",
      "dataPath": "/customers",
      "columns": [
        { "header": "ID", "dataPath": "/customerId" },
        { "header": "Name", "dataPath": "/customerName" },
        { "header": "Email", "dataPath": "/email" }
      ]
    },
    {
      "id": "action_buttons",
      "component": "Row",
      "children": ["btn_new", "btn_refresh"]
    },
    {
      "id": "btn_new",
      "component": "Button",
      "label": "New Customer",
      "action": { "type": "navigate", "target": "/new" }
    }
  ]
}
```

**Step 4: React Frontend Consumes A2UI**

```jsx
// App.jsx
import { A2UIProvider, A2UIRenderer, standardCatalog } from '@a2ui-sdk/react/0.8';
import { useEffect, useState } from 'react';

function App() {
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    // Stream A2UI messages from agent
    const eventSource = new EventSource('/api/agent/stream?query=Show customers');
    
    eventSource.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setMessages(prev => [...prev, msg]);
    };
    
    return () => eventSource.close();
  }, []);
  
  const customCatalog = {
    ...standardCatalog,
    components: {
      ...standardCatalog.components,
      // Override with company-specific styling
      Button: CustomButton,
      Table: CustomDataTable
    }
  };
  
  return (
    <A2UIProvider catalog={customCatalog} messages={messages}>
      <A2UIRenderer onAction={handleUserAction} />
    </A2UIProvider>
  );
}

function handleUserAction(action) {
  // User clicked button, submitted form, etc.
  console.log('User action:', action);
  // Send back to agent for processing
}
```

**Migration Timeline for ASPX:**
- Week 1-2: Extract CustomerService logic, build REST API
- Week 3: Create customer_agent.py with proper prompting
- Week 4: Build React frontend with A2UI renderer
- Week 5: Test, optimize, handle edge cases

---

## JSP Migration Example

### Before: Legacy JSP Page
```jsp
<!-- customerList.jsp -->
<%@ page language="java" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<table border="1">
  <tr>
    <th>ID</th><th>Name</th><th>Email</th>
  </tr>
  <c:forEach var="customer" items="${customers}">
    <tr>
      <td>${customer.id}</td>
      <td>${customer.name}</td>
      <td>${customer.email}</td>
    </tr>
  </c:forEach>
</table>

<form action="customerSave" method="POST">
  <input type="text" name="name" placeholder="Customer Name" />
  <input type="submit" value="Save" />
</form>
```

**Servlet (CustomerServlet.java):**
```java
@WebServlet("/customers")
public class CustomerServlet extends HttpServlet {
    private CustomerService customerService = new CustomerService();
    
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        List<Customer> customers = customerService.getAllCustomers();
        req.setAttribute("customers", customers);
        req.getRequestDispatcher("/customerList.jsp").forward(req, resp);
    }
}
```

### After: A2UI + Spring Boot REST

**Step 1: Spring Boot REST Controller**

```java
// CustomerController.java (Spring Boot)
@RestController
@RequestMapping("/api/customers")
public class CustomerController {
    
    @Autowired
    private CustomerService customerService;
    
    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }
    
    @PostMapping
    public ResponseEntity<Customer> saveCustomer(@RequestBody Customer customer) {
        return ResponseEntity.ok(customerService.save(customer));
    }
}
```

**Step 2: A2UI Agent (Java with Google ADK)**

```java
// CustomerUIAgent.java
@Component
public class CustomerUIAgent {
    
    @Autowired
    private RestTemplate restTemplate;
    
    public A2UIResponse generateCustomerUI(String action) {
        if ("list".equals(action)) {
            return generateCustomerList();
        } else if ("form".equals(action)) {
            return generateCustomerForm();
        }
        return null;
    }
    
    private A2UIResponse generateCustomerList() {
        // Fetch customer data
        List<Customer> customers = restTemplate.getForObject(
            "http://localhost:8080/api/customers",
            new ParameterizedTypeReference<List<Customer>>() {}
        );
        
        // Build A2UI JSON
        A2UISurface surface = new A2UISurface()
            .setSurfaceId("customer_list")
            .setRootComponentId("root");
        
        A2UIComponent table = new A2UIComponent()
            .setId("customer_table")
            .setComponent("Table")
            .setDataPath("/customers")
            .setColumns(asList(
                new Column().setHeader("ID").setDataPath("/id"),
                new Column().setHeader("Name").setDataPath("/name"),
                new Column().setHeader("Email").setDataPath("/email")
            ));
        
        // Return A2UI payload with data
        return new A2UIResponse()
            .setSurface(surface)
            .addComponent(table)
            .setData(new DataModel().setCustomers(customers));
    }
}
```

**Step 3: React Frontend (Similar to ASPX example)**

```jsx
// CustomerUI.jsx
function CustomerUI() {
  const [a2uiMessages, setA2UIMessages] = useState([]);
  
  useEffect(() => {
    fetchA2UIFromAgent('list')
      .then(messages => setA2UIMessages(messages));
  }, []);
  
  return (
    <A2UIProvider messages={a2uiMessages}>
      <A2UIRenderer onAction={handleAction} />
    </A2UIProvider>
  );
}
```

**Migration Timeline for JSP:**
- Week 1: Identify all Servlets/JSPs to migrate
- Week 2: Build Spring Boot REST endpoints (parallelize Servlet → Controller migration)
- Week 3: Create A2UI agents for each JSP view
- Week 4: Build React frontend with A2UI rendering
- Week 5: Test, UAT, rollout in waves

---

## React Integration Example

### Scenario: Dynamic Form Generation

**Before: Hard-coded Form Component**
```jsx
// CustomerForm.jsx (OLD - static)
function CustomerForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    apiClient.post('/customers', { name, email });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="submit">Save</button>
    </form>
  );
}
```

**After: A2UI Agent-Generated Form**

```jsx
// CustomerForm.jsx (NEW - agent-generated)
import { A2UIProvider, A2UIRenderer, standardCatalog } from '@a2ui-sdk/react/0.8';
import { useState, useEffect } from 'react';

function DynamicCustomerForm({ schema }) {
  const [a2uiMessages, setA2UIMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Agent generates form based on schema
    generateFormUI(schema)
      .then(messages => {
        setA2UIMessages(messages);
        setLoading(false);
      });
  }, [schema]);
  
  const handleFormAction = async (action) => {
    if (action.type === 'submit') {
      const result = await apiClient.post('/customers', action.data);
      // Agent can generate success/error message
      const responseMessages = await generateResponse(result);
      setA2UIMessages(prev => [...prev, ...responseMessages]);
    }
  };
  
  if (loading) return <div>Generating form...</div>;
  
  return (
    <A2UIProvider messages={a2uiMessages}>
      <A2UIRenderer onAction={handleFormAction} />
    </A2UIProvider>
  );
}

// Usage:
export default function App() {
  const dynamicSchema = {
    type: 'customer',
    fields: ['name', 'email', 'phone', 'address']
  };
  
  return <DynamicCustomerForm schema={dynamicSchema} />;
}
```

**Agent Prompt for Form Generation:**

```python
FORM_GENERATION_PROMPT = """
Given a data schema, generate an A2UI form component.

Schema properties:
{
  "type": "customer",
  "fields": ["name", "email", "phone", "address"]
}

Generate A2UI JSON that creates a form with:
1. Text field for name (required)
2. Email field (with validation)
3. Phone field (optional)
4. Address text area
5. Submit button
6. Cancel button

A2UI Examples:
[examples of form components...]

A2UI Schema:
[schema definition...]

Return ONLY the A2UI JSON messages, no explanatory text.
"""
```

**Custom Component Integration (Advanced):**

```jsx
// customCatalog.jsx
import { standardCatalog } from '@a2ui-sdk/react/0.8';
import { CustomButton, CustomTextField, CustomForm } from './customComponents';

const customCatalog = {
  ...standardCatalog,
  components: {
    ...standardCatalog.components,
    
    // Override with company design system
    Button: CustomButton,
    TextField: CustomTextField,
    Form: CustomForm,
    
    // Add custom components specific to your domain
    CustomerSelector: CustomerSelectorComponent,
    ProductTable: ProductTableComponent,
    PricingCalculator: PricingCalculatorComponent
  }
};

export default customCatalog;
```

**Integration Timeline for React:**
- Day 1: Set up @a2ui-sdk/react package
- Day 2-3: Create custom catalog with branded components
- Day 3-4: Build agent for dynamic form generation
- Day 4: Test and optimize
- Day 5: Deploy to production

---

## Oracle OJet Integration Example

### Step 1: Create A2UI Custom Catalog for OJet Components

```json
{
  "catalogId": "https://your-org.com/catalogs/oracle-jet-standard.json",
  "catalogVersion": "1.0.0",
  "components": {
    "OJetButton": {
      "description": "Oracle JET Button Component",
      "category": "buttons",
      "properties": {
        "label": {
          "type": "string",
          "description": "Button label text"
        },
        "disabled": {
          "type": "boolean",
          "description": "Is button disabled"
        },
        "type": {
          "type": "string",
          "enum": ["button", "submit", "reset"],
          "default": "button"
        },
        "chroming": {
          "type": "string",
          "enum": ["half", "full"],
          "default": "half"
        }
      },
      "actions": ["click"]
    },
    
    "OJetTable": {
      "description": "Oracle JET Data Table",
      "category": "data",
      "properties": {
        "data": {
          "type": "object",
          "description": "Table data source",
          "dataPath": "true"
        },
        "columns": {
          "type": "array",
          "description": "Column definitions",
          "items": {
            "type": "object",
            "properties": {
              "headerText": { "type": "string" },
              "field": { "type": "string" },
              "width": { "type": "string" }
            }
          }
        },
        "selectionMode": {
          "type": "string",
          "enum": ["none", "single", "multiple"],
          "default": "single"
        }
      },
      "actions": ["selectionChanged", "rowClick"]
    },
    
    "OJetInputText": {
      "description": "Oracle JET Text Input Field",
      "category": "input",
      "properties": {
        "value": {
          "type": "string",
          "dataPath": "true"
        },
        "placeholder": { "type": "string" },
        "disabled": { "type": "boolean" },
        "readonly": { "type": "boolean" },
        "required": { "type": "boolean" },
        "type": {
          "type": "string",
          "enum": ["text", "email", "number", "password"],
          "default": "text"
        }
      },
      "actions": ["change", "blur"]
    },
    
    "OJetSelectSingle": {
      "description": "Oracle JET Single Select",
      "category": "input",
      "properties": {
        "options": {
          "type": "array",
          "dataPath": "true",
          "items": { "type": "object" }
        },
        "value": {
          "type": "string",
          "dataPath": "true"
        },
        "disabled": { "type": "boolean" }
      },
      "actions": ["change"]
    },
    
    "OJetDatePicker": {
      "description": "Oracle JET Date Picker",
      "category": "input",
      "properties": {
        "value": {
          "type": "string",
          "description": "ISO 8601 date format"
        },
        "disabled": { "type": "boolean" },
        "placeholder": { "type": "string" }
      },
      "actions": ["change"]
    },
    
    "OJetChart": {
      "description": "Oracle JET Chart Component",
      "category": "visualization",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["bar", "line", "pie", "area", "scatter"],
          "default": "bar"
        },
        "data": {
          "type": "object",
          "dataPath": "true"
        },
        "title": { "type": "string" },
        "xAxisLabel": { "type": "string" },
        "yAxisLabel": { "type": "string" }
      },
      "actions": ["itemSelect"]
    }
  }
}
```

### Step 2: Create Smart Wrapper Components (React)

```jsx
// OJetComponentWrappers.jsx
import React, { useEffect, useRef } from 'react';
import { useDispatchAction } from '@a2ui-sdk/react/0.8';

// Wrapper for oj-button
export function OJetButton({
  surfaceId,
  componentId,
  label,
  disabled,
  type,
  action,
  ...props
}) {
  const buttonRef = useRef(null);
  const dispatchAction = useDispatchAction();
  
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    
    const handleClick = () => {
      if (action) {
        dispatchAction(surfaceId, componentId, action);
      }
    };
    
    button.addEventListener('ojAction', handleClick);
    return () => button.removeEventListener('ojAction', handleClick);
  }, [action, dispatchAction, surfaceId, componentId]);
  
  return (
    <oj-button
      ref={buttonRef}
      disabled={disabled}
      {...props}
    >
      {label}
    </oj-button>
  );
}

// Wrapper for oj-input-text with data binding
export function OJetInputText({
  surfaceId,
  componentId,
  value,
  dataPath,
  placeholder,
  type,
  action,
  ...props
}) {
  const inputRef = useRef(null);
  const dispatchAction = useDispatchAction();
  
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    
    const handleChange = (e) => {
      // Dispatch data update to agent
      dispatchAction(surfaceId, componentId, {
        type: 'updateData',
        dataPath,
        value: e.target.value
      });
    };
    
    input.addEventListener('ojChange', handleChange);
    return () => input.removeEventListener('ojChange', handleChange);
  }, [dataPath, dispatchAction, surfaceId, componentId]);
  
  return (
    <oj-input-text
      ref={inputRef}
      value={value}
      placeholder={placeholder}
      type={type}
      {...props}
    />
  );
}

// Wrapper for oj-table
export function OJetTable({
  surfaceId,
  componentId,
  data,
  columns,
  selectionMode,
  action,
  ...props
}) {
  const tableRef = useRef(null);
  const dispatchAction = useDispatchAction();
  
  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    
    const handleSelectionChanged = (e) => {
      dispatchAction(surfaceId, componentId, {
        type: 'tableSelection',
        selectedRows: e.detail.value
      });
    };
    
    table.addEventListener('ojSelectionChanged', handleSelectionChanged);
    return () => table.removeEventListener('ojSelectionChanged', handleSelectionChanged);
  }, [dispatchAction, surfaceId, componentId]);
  
  return (
    <oj-table
      ref={tableRef}
      data={data}
      selectionMode={{ row: selectionMode }}
      columns={columns.map(col => ({
        headerText: col.headerText,
        field: col.field,
        width: col.width || 'auto'
      }))}
      {...props}
    />
  );
}

export function OJetDatePicker({
  surfaceId,
  componentId,
  value,
  dataPath,
  ...props
}) {
  const datePickerRef = useRef(null);
  const dispatchAction = useDispatchAction();
  
  useEffect(() => {
    const dp = datePickerRef.current;
    if (!dp) return;
    
    const handleChange = (e) => {
      dispatchAction(surfaceId, componentId, {
        type: 'updateData',
        dataPath,
        value: e.detail.value
      });
    };
    
    dp.addEventListener('ojChange', handleChange);
    return () => dp.removeEventListener('ojChange', handleChange);
  }, [dataPath, dispatchAction, surfaceId, componentId]);
  
  return (
    <oj-date-picker
      ref={datePickerRef}
      value={value}
      {...props}
    />
  );
}

export function OJetChart({
  chartType,
  data,
  title,
  ...props
}) {
  return (
    <oj-chart
      type={chartType}
      data={data}
      title={title}
      {...props}
    />
  );
}
```

### Step 3: Register OJet Catalog in React App

```jsx
// App.jsx
import { A2UIProvider, A2UIRenderer, standardCatalog } from '@a2ui-sdk/react/0.8';
import {
  OJetButton,
  OJetInputText,
  OJetTable,
  OJetDatePicker,
  OJetChart
} from './OJetComponentWrappers';

const ojETCatalog = {
  ...standardCatalog,
  components: {
    ...standardCatalog.components,
    // Standard A2UI components
    Button: standardCatalog.components.Button,
    
    // Override with OJet components
    OJetButton,
    OJetInputText,
    OJetTable,
    OJetDatePicker,
    OJetChart,
    // ... more OJet wrappers
  }
};

function App() {
  const [messages, setMessages] = useState([]);
  
  return (
    <A2UIProvider catalog={ojETCatalog} messages={messages}>
      <A2UIRenderer onAction={handleAction} />
    </A2UIProvider>
  );
}
```

### Step 4: Agent Prompt for OJet Component Generation

```python
OJET_AGENT_PROMPT = """
You are an Oracle JET UI expert. Generate A2UI JSON that uses Oracle JET components.

When users ask you to create forms, dashboards, or data tables:
1. Use OJet components (OJetButton, OJetInputText, OJetTable, etc.)
2. Follow Oracle design patterns
3. Return ONLY A2UI JSON

Available OJet Components in A2UI Catalog:
- OJetButton: Styled button
- OJetInputText: Text input with validation
- OJetSelectSingle: Single-select dropdown
- OJetDatePicker: Date selection
- OJetTable: Data table with selection
- OJetChart: Charts (bar, line, pie, area, scatter)

Example for user request "Create an employee form":

{
  "createSurface": {
    "surfaceId": "employee_form",
    "catalogId": "https://your-org.com/catalogs/oracle-jet-standard.json"
  }
}

{
  "updateComponents": [
    {
      "id": "form_container",
      "component": "Column",
      "children": ["name_field", "email_field", "date_field", "submit_btn"]
    },
    {
      "id": "name_field",
      "component": "OJetInputText",
      "label": "Employee Name",
      "placeholder": "Enter name",
      "required": true,
      "dataPath": "/employee/name"
    },
    {
      "id": "email_field",
      "component": "OJetInputText",
      "type": "email",
      "label": "Email",
      "dataPath": "/employee/email"
    },
    {
      "id": "date_field",
      "component": "OJetDatePicker",
      "label": "Start Date",
      "dataPath": "/employee/startDate"
    },
    {
      "id": "submit_btn",
      "component": "OJetButton",
      "label": "Save Employee",
      "action": { "type": "submit", "target": "/api/employees" }
    }
  ]
}

A2UI SCHEMA:
[schema...]
"""
```

### Step 5: Implementation Timeline for OJet Integration

**Week 1-2: Catalog & Wrappers**
- Define OJet component catalog (JSON)
- Create React wrappers for 10-15 key OJet components
- Test data binding and event handling

**Week 3-4: Agent Development**
- Build OJet-aware agent
- Create component examples for prompting
- Validate generated JSON

**Week 5: Testing & Refinement**
- End-to-end testing with sample forms
- Optimize wrapper components
- Document for team

**Total: 5 weeks (roughly 2.5-3 months for full implementation)**

---

## Data Flow Diagrams

### ASPX Migration Data Flow
```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                         │
└──────────────┬──────────────────────────────────────────────┘
               │
        ┌──────▼──────┐
        │  React App  │
        │ (A2UI Renderer)
        └──────┬──────┘
               │
        ┌──────▼──────────────────┐
        │  A2UI Agent (Python)    │
        │  - Interprets user input │
        │  - Calls backend APIs    │
        │  - Generates A2UI JSON   │
        └──────┬──────────────────┘
               │
        ┌──────▼──────────────────┐
        │ ASP.NET Core REST API   │
        │ CustomerController      │
        └──────┬──────────────────┘
               │
        ┌──────▼──────────────────┐
        │ Business Logic Layer    │
        │ CustomerService         │
        │ (Extracted from ASPX)   │
        └──────┬──────────────────┘
               │
        ┌──────▼──────────────────┐
        │    Database Layer       │
        │    Existing DB          │
        └─────────────────────────┘

Data Flow:
1. User interacts with React component (A2UI rendered)
2. React sends action to Agent
3. Agent calls REST API
4. API calls business logic
5. Business logic queries database
6. Data returns to agent
7. Agent generates A2UI JSON
8. React renderer displays updated UI
```

### JSP Migration Data Flow
```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                         │
└──────────────┬──────────────────────────────────────────────┘
               │
        ┌──────▼──────┐
        │  React App  │
        │ (A2UI Renderer)
        └──────┬──────┘
               │
        ┌──────▼──────────────────┐
        │  A2UI Agent (Java)      │
        │  - REST template calls  │
        │  - A2UI JSON generation │
        └──────┬──────────────────┘
               │
        ┌──────▼──────────────────┐
        │ Spring Boot REST API    │
        │ CustomerController      │
        │ (Extracted from Servlet)│
        └──────┬──────────────────┘
               │
        ┌──────▼──────────────────┐
        │ Business Logic Layer    │
        │ CustomerService         │
        │ (Existing Spring Beans) │
        └──────┬──────────────────┘
               │
        ┌──────▼──────────────────┐
        │    Database Layer       │
        │    Existing DB          │
        └─────────────────────────┘
        
```

### React + A2UI Data Flow
```
┌─────────────────────────────────────────────────────────────┐
│          USER INTERACTION WITH A2UI RENDERED UI             │
└──────────────┬──────────────────────────────────────────────┘
               │
        ┌──────▼──────────────────┐
        │  A2UI Renderer (React)  │
        │  - Standard components  │
        │  - Custom catalog       │
        │  - Data binding         │
        └──────┬──────────────────┘
               │
        ┌──────▼──────────────────┐
        │  Agent (Gemini/Claude)  │
        │  - Interprets actions   │
        │  - Context understanding│
        │  - UI generation logic  │
        └──────┬──────────────────┘
               │
        ┌──────▼──────────────────┐
        │   Existing REST API     │
        │   (Unchanged)           │
        └──────┬──────────────────┘
               │
        ┌──────▼──────────────────┐
        │   Backend Services      │
        │   (Unchanged)           │
        └──────┬──────────────────┘
               │
        ┌──────▼──────────────────┐
        │    Database             │
        │    (Unchanged)          │
        └─────────────────────────┘

Data Binding Flow:
Component → dataPath → /dataModel → Agent updates → Component re-renders
```

### OJet + A2UI Data Flow
```
┌─────────────────────────────────────────────────────────────┐
│          USER INTERACTION WITH ORACLE JET UI                │
└──────────────┬──────────────────────────────────────────────┘
               │
        ┌──────▼──────────────────┐
        │  OJet Smart Wrappers    │
        │  - Map A2UI → OJet      │
        │  - Handle OJet events   │
        │  - Oracle styling       │
        └──────┬──────────────────┘
               │
        ┌──────▼──────────────────┐
        │  A2UI Renderer (React)  │
        │  - OJet Catalog         │
        │  - Data binding         │
        └──────┬──────────────────┘
               │
        ┌──────▼──────────────────┐
        │  OJet-Aware Agent       │
        │  - Understands OJet     │
        │    components           │
        │  - Generates A2UI JSON  │
        │    with OJet refs       │
        └──────┬──────────────────┘
               │
        ┌──────▼──────────────────┐
        │   REST API              │
        │   (Backend agnostic)    │
        └──────┬──────────────────┘
               │
        ┌──────▼──────────────────┐
        │   Business Services     │
        └─────────────────────────┘
```

---

## Key Implementation Takeaways

### ASPX
- Significant architectural changes required
- Decouple business logic from UI code-behind
- Build comprehensive REST APIs
- Invest in agent prompting

### JSP
- Cleaner separation opportunity (Servlet/JSP split already exists)
- Leverage existing Spring ecosystem
- Faster extraction to REST APIs
- Good fit for form-centric applications

### React
- Minimal architectural changes
- Perfect for agent-generated dynamic UIs
- Custom catalog easily extends functionality
- Best for new feature development

### Oracle OJet
- 2.5-5 month implementation window
- Start with high-use components
- Create reusable Smart Wrappers
- Maintain catalog versioning

---

**Next Steps:**
1. Choose your primary tech stack (ASPX/JSP/React)
2. Identify 2-3 pilot pages
3. Estimate effort using examples above
4. Begin Phase 0 assessment
5. Schedule team kickoff