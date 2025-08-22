// Contact Form Handler with Backend Integration
class ContactFormHandler {
    constructor(formId, apiUrl = '/api/contact') {
        this.form = document.getElementById(formId);
        this.apiUrl = apiUrl;
        this.init();
    }
    
    init() {
        if (!this.form) return;
        
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.setupValidation();
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.querySelector('.btn-text').textContent;
        
        try {
            // Show loading state
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            
            // Get form data
            const formData = new FormData(this.form);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                subject: formData.get('subject'),
                message: formData.get('message'),
                timestamp: new Date().toISOString()
            };
            
            // Validate data
            const validation = this.validateData(data);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            
            // Send to backend
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to send message');
            }
            
            // Show success
            this.showSuccessModal();
            this.form.reset();
            this.clearValidation();
            
        } catch (error) {
            console.error('Error submitting form:', error);
            this.showError(error.message);
        } finally {
            // Reset button state
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }
    
    validateData(data) {
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!data.name || data.name.trim().length < 2) {
            return { valid: false, message: 'Name must be at least 2 characters long' };
        }
        
        if (!data.email || !emailRegex.test(data.email)) {
            return { valid: false, message: 'Please enter a valid email address' };
        }
        
        if (!data.subject || data.subject.trim().length < 5) {
            return { valid: false, message: 'Subject must be at least 5 characters long' };
        }
        
        if (!data.message || data.message.trim().length < 10) {
            return { valid: false, message: 'Message must be at least 10 characters long' };
        }
        
        return { valid: true };
    }
    
    setupValidation() {
        const inputs = this.form.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }
    
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.getAttribute('name');
        let isValid = true;
        let message = '';
        
        switch (fieldName) {
            case 'name':
                isValid = value.length >= 2;
                message = 'Name must be at least 2 characters long';
                break;
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailRegex.test(value);
                message = 'Please enter a valid email address';
                break;
            case 'subject':
                isValid = value.length >= 5;
                message = 'Subject must be at least 5 characters long';
                break;
            case 'message':
                isValid = value.length >= 10;
                message = 'Message must be at least 10 characters long';
                break;
        }
        
        if (!isValid && value) {
            this.showFieldError(field, message);
        } else {
            this.clearFieldError(field);
        }
        
        return isValid;
    }
    
    showFieldError(field, message) {
        const formGroup = field.closest('.form-group');
        
        // Remove existing error
        const existingError = formGroup.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#ef4444';
        errorDiv.style.fontSize = '0.8rem';
        errorDiv.style.marginTop = '0.5rem';
        
        formGroup.appendChild(errorDiv);
        formGroup.classList.add('error');
    }
    
    clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        const errorDiv = formGroup.querySelector('.field-error');
        
        if (errorDiv) {
            errorDiv.remove();
        }
        
        formGroup.classList.remove('error');
    }
    
    clearValidation() {
        const formGroups = this.form.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('error');
            const errorDiv = group.querySelector('.field-error');
            if (errorDiv) {
                errorDiv.remove();
            }
        });
    }
    
    showSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.add('show');
        }
    }
    
    showError(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
                <button class="close-notification">&times;</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 9999;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);
        
        // Close button
        const closeBtn = notification.querySelector('.close-notification');
        closeBtn.addEventListener('click', () => this.removeNotification(notification));
        
        // Add CSS animation
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .close-notification {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    margin-left: auto;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    removeNotification(notification) {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ContactFormHandler('contactForm');
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContactFormHandler;
}