# 🚀 Quick Start Guide - MediConnect Security Platform

## ⚡ **IMMEDIATE SETUP (5 minutes)**

### **Step 1: Start Backend Server**
```bash
cd frame-shop-backend
npm install
npm start
```
**Expected Output:**
```
🔒 MediConnect Security-Enhanced Server
🌐 Server running on port 3001
🔗 API URL: http://localhost:3001
📊 Health Check: http://localhost:3001/api/health
🛡️ Security Status: http://localhost:3001/api/security/status
```

### **Step 2: Start Frontend**
```bash
cd newframefront/frame-fusion-ecommerce-app
npm install
npm run dev
```
**Expected Output:**
```
Local:   http://localhost:8081/
Network: use --host to expose
```

### **Step 3: Seed Database**
```bash
cd frame-shop-backend
node seedDoctors.js
```

## 🧪 **QUICK SECURITY TESTING**

### **Test 1: Password Security**
1. Go to `http://localhost:8081/register`
2. Try password: `weak`
3. **Expected**: Error with password strength details

### **Test 2: Brute Force Protection**
1. Go to `http://localhost:8081/login`
2. Try wrong password 5 times
3. **Expected**: Account locked for 15 minutes

### **Test 3: MFA Setup**
1. Register a new account
2. Login and go to profile
3. Setup MFA with Google Authenticator
4. **Expected**: QR code and backup codes

### **Test 4: Security Headers**
```bash
curl -I http://localhost:3001/api/health
```
**Expected**: Security headers in response

### **Test 5: Rate Limiting**
```bash
# Make 101 requests quickly
for i in {1..101}; do curl http://localhost:3001/api/health; done
```
**Expected**: Rate limit exceeded after 100 requests

## 🔍 **SECURITY FEATURES TO DEMONSTRATE**

### **1. Password Strength Validation**
- Try weak passwords: `123`, `password`, `abc`
- Try strong passwords: `SecurePass123!`, `MyComplex@Password2024`

### **2. Account Lockout**
- Attempt 5 failed logins
- See account locked message
- Wait 15 minutes for unlock

### **3. Multi-Factor Authentication**
- Setup TOTP with Google Authenticator
- Scan QR code
- Verify with 6-digit code
- Test backup codes

### **4. XSS Protection**
- Try input: `<script>alert('xss')</script>`
- See content sanitized

### **5. NoSQL Injection Prevention**
- Try URL: `?email[$ne]=test@example.com`
- See blocked request

### **6. Audit Logging**
- Check `/api/security/status`
- View security features status

## 📊 **MONITORING ENDPOINTS**

### **Health Check**
```bash
curl http://localhost:3001/api/health
```

### **Security Status**
```bash
curl http://localhost:3001/api/security/status
```

### **Available Doctors**
```bash
curl http://localhost:3001/api/doctors
```

## 🎯 **VIDEO DEMONSTRATION SCRIPT**

### **Part 1: Registration & Password Security (2 min)**
1. Show registration form
2. Try weak password - show error
3. Try strong password - show success
4. Demonstrate password requirements

### **Part 2: Login & Brute Force Protection (2 min)**
1. Show login form
2. Try wrong password multiple times
3. Show account lockout
4. Demonstrate rate limiting

### **Part 3: MFA Setup (2 min)**
1. Show MFA setup in profile
2. Generate QR code
3. Scan with Google Authenticator
4. Verify with TOTP code

### **Part 4: Security Testing (2 min)**
1. Test XSS injection
2. Test NoSQL injection
3. Show security headers
4. Display audit logs

### **Part 5: Healthcare Features (2 min)**
1. Browse doctors
2. Book appointment
3. View medical records
4. Show role-based access

## 🔧 **TROUBLESHOOTING**

### **Backend Won't Start**
```bash
# Kill existing processes
taskkill /f /im node.exe

# Clear port
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Start again
cd frame-shop-backend
npm start
```

### **Frontend Won't Start**
```bash
# Clear cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### **Database Connection Issues**
```bash
# Check MongoDB
mongod --version

# Start MongoDB if not running
mongod
```

## 📋 **FINAL CHECKLIST**

### **Before Video Recording**
- [ ] Backend running on port 3001
- [ ] Frontend running on port 8081
- [ ] Database seeded with doctors
- [ ] Test account created
- [ ] Google Authenticator app installed
- [ ] All security features working

### **Security Features Verified**
- [ ] Password strength validation
- [ ] Brute force protection
- [ ] MFA setup and verification
- [ ] XSS protection
- [ ] NoSQL injection prevention
- [ ] Rate limiting
- [ ] Audit logging
- [ ] Security headers

### **Healthcare Features Working**
- [ ] Doctor listing
- [ ] Appointment booking
- [ ] Medical records
- [ ] Role-based access
- [ ] User profiles

## 🎉 **READY FOR SUBMISSION**

Your MediConnect security platform is now ready for:
- ✅ Academic submission
- ✅ Video demonstration
- ✅ Penetration testing
- ✅ Security assessment
- ✅ Code review

**All security features are implemented, tested, and documented!** 