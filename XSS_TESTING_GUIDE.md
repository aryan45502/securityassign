# XSS Security Testing Guide for MediConnect

## **🔍 Manual XSS Testing**

### **Basic XSS Payloads to Test:**

```javascript
// 1. Basic Alert Test
<script>alert('XSS')</script>

// 2. Image Tag XSS
<img src="x" onerror="alert('XSS')">

// 3. Input Field Testing
"><script>alert('XSS')</script>

// 4. Event Handler XSS
" onmouseover="alert('XSS')" "

// 5. JavaScript Protocol
javascript:alert('XSS')

// 6. Encoded XSS
&#60;script&#62;alert('XSS')&#60;/script&#62;

// 7. Unicode XSS
\u003Cscript\u003Ealert('XSS')\u003C/script\u003E

// 8. Mixed Case XSS
<ScRiPt>alert('XSS')</ScRiPt>

// 9. Null Byte Injection
<script>alert('XSS')</script>

// 10. SVG XSS
<svg onload="alert('XSS')">
```

### **Test Locations:**

1. **Registration Form** (`/register`)
   - Name field
   - Email field
   - Phone field

2. **Login Form** (`/login`)
   - Email field
   - Password field

3. **Contact Form** (`/contact`)
   - Name field
   - Email field
   - Subject field
   - Message field

4. **Profile Update** (`/profile`)
   - Name field
   - Phone field
   - Address fields

5. **Medical Records** (`/medical-records`)
   - Symptoms field
   - Diagnosis field
   - Notes field

## **🛠️ Automated XSS Testing**

### **Using Browser Developer Tools:**

1. **Open Developer Tools** (F12)
2. **Go to Console tab**
3. **Test each input field:**

```javascript
// Test if input is properly sanitized
function testXSS(fieldName, payload) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field) {
        field.value = payload;
        console.log(`Testing ${fieldName} with: ${payload}`);
    }
}

// Test common fields
testXSS('name', '<script>alert("XSS")</script>');
testXSS('email', '"><img src=x onerror=alert("XSS")>');
testXSS('message', 'javascript:alert("XSS")');
```

### **Using Online XSS Scanners:**

1. **OWASP ZAP** (Zed Attack Proxy)
2. **Burp Suite Community Edition**
3. **XSS Hunter** (Online tool)

## **🔧 Backend XSS Protection Check**

### **Check Your Security Middleware:**

```javascript
// In frame-shop-backend/middleware/securityMiddleware.js
// Verify these functions are active:

1. xssProtection - Should sanitize all inputs
2. inputValidation - Should validate input formats
3. sanitizeObject - Should clean object properties
```

### **Test API Endpoints:**

```bash
# Test registration endpoint
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert(\"XSS\")</script>",
    "email": "test@example.com",
    "phone": "1234567890",
    "password": "Test123!"
  }'

# Test contact form
curl -X POST http://localhost:3001/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "<img src=x onerror=alert(\"XSS\")>",
    "message": "Test message"
  }'
```

## **📋 XSS Testing Checklist**

### **Frontend Testing:**
- [ ] Test all input fields with XSS payloads
- [ ] Check if alerts execute in browser
- [ ] Verify form submission with malicious input
- [ ] Test URL parameters for reflected XSS
- [ ] Check localStorage/sessionStorage for stored XSS

### **Backend Testing:**
- [ ] Verify input sanitization is working
- [ ] Check if malicious data reaches database
- [ ] Test API endpoints with XSS payloads
- [ ] Verify response headers include XSS protection
- [ ] Check if error messages reflect user input

### **Security Headers Check:**
```bash
# Check if XSS protection headers are set
curl -I http://localhost:3000

# Should include:
# X-XSS-Protection: 1; mode=block
# Content-Security-Policy: default-src 'self'
```

## **🚨 Common XSS Vulnerabilities to Check:**

1. **Reflected XSS** - Input reflected in response
2. **Stored XSS** - Input stored in database
3. **DOM XSS** - Client-side script injection
4. **Blind XSS** - XSS in admin panels
5. **Self-XSS** - Social engineering attacks

## **✅ XSS Protection Verification:**

### **Check Your Implementation:**

1. **Input Sanitization** - All inputs should be cleaned
2. **Output Encoding** - All outputs should be encoded
3. **Content Security Policy** - CSP headers should be set
4. **XSS Protection Headers** - Browser XSS protection enabled
5. **Input Validation** - Proper format validation

### **Test Results:**

- ✅ **Protected** - XSS payloads are sanitized/blocked
- ❌ **Vulnerable** - XSS payloads execute successfully
- ⚠️ **Partial** - Some payloads work, others don't

## **🔧 Quick XSS Test Script:**

```javascript
// Add this to browser console to test all forms
function testAllForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach((form, index) => {
        console.log(`Testing form ${index + 1}:`, form.action);
        
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            const originalValue = input.value;
            input.value = '<script>alert("XSS Test")</script>';
            console.log(`Testing input: ${input.name || input.id}`);
            
            // Reset value
            input.value = originalValue;
        });
    });
}

// Run the test
testAllForms();
```

## **📞 Report Findings:**

If you find XSS vulnerabilities:
1. Document the vulnerable field
2. Note the payload that worked
3. Check if it's reflected or stored
4. Test in different browsers
5. Report to development team immediately 