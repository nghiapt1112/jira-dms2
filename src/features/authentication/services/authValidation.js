export const authValidation = {
  // Username validation
  validateUsername: (username) => {
    const errors = []
    
    if (!username) {
      errors.push('Username is required')
    } else if (username.length < 3) {
      errors.push('Username must be at least 3 characters')
    } else if (username.length > 50) {
      errors.push('Username must be less than 50 characters')
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, dots, hyphens and underscores')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Password validation
  validatePassword: (password) => {
    const errors = []
    
    if (!password) {
      errors.push('Password is required')
    } else if (password.length < 6) {
      errors.push('Password must be at least 6 characters')
    } else if (password.length > 128) {
      errors.push('Password must be less than 128 characters')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Login form validation
  validateLoginForm: (formData) => {
    const { username, password } = formData
    const fieldErrors = {}
    
    const usernameValidation = authValidation.validateUsername(username)
    if (!usernameValidation.isValid) {
      fieldErrors.username = usernameValidation.errors[0]
    }
    
    const passwordValidation = authValidation.validatePassword(password)
    if (!passwordValidation.isValid) {
      fieldErrors.password = passwordValidation.errors[0]
    }
    
    return {
      isValid: Object.keys(fieldErrors).length === 0,
      errors: fieldErrors
    }
  },

  // Profile validation
  validateProfile: (profileData) => {
    const { username, email, firstName, lastName } = profileData
    const fieldErrors = {}
    
    // Validate username if provided
    if (username !== undefined) {
      const usernameValidation = authValidation.validateUsername(username)
      if (!usernameValidation.isValid) {
        fieldErrors.username = usernameValidation.errors[0]
      }
    }
    
    // Validate email if provided
    if (email !== undefined) {
      const emailValidation = authValidation.validateEmail(email)
      if (!emailValidation.isValid) {
        fieldErrors.email = emailValidation.errors[0]
      }
    }
    
    // Validate first name if provided
    if (firstName !== undefined) {
      const firstNameValidation = authValidation.validateName(firstName, 'First name')
      if (!firstNameValidation.isValid) {
        fieldErrors.firstName = firstNameValidation.errors[0]
      }
    }
    
    // Validate last name if provided
    if (lastName !== undefined) {
      const lastNameValidation = authValidation.validateName(lastName, 'Last name')
      if (!lastNameValidation.isValid) {
        fieldErrors.lastName = lastNameValidation.errors[0]
      }
    }
    
    return {
      isValid: Object.keys(fieldErrors).length === 0,
      errors: fieldErrors
    }
  },

  // Email validation
  validateEmail: (email) => {
    const errors = []
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!email) {
      errors.push('Email is required')
    } else if (!emailRegex.test(email)) {
      errors.push('Please enter a valid email address')
    } else if (email.length > 254) {
      errors.push('Email must be less than 254 characters')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Name validation (for first name, last name, etc.)
  validateName: (name, fieldName = 'Name') => {
    const errors = []
    
    if (!name) {
      errors.push(`${fieldName} is required`)
    } else if (name.length < 2) {
      errors.push(`${fieldName} must be at least 2 characters`)
    } else if (name.length > 50) {
      errors.push(`${fieldName} must be less than 50 characters`)
    } else if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      errors.push(`${fieldName} can only contain letters, spaces, hyphens and apostrophes`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Role validation
  validateRole: (role) => {
    const validRoles = ['USER', 'ADMIN', 'MODERATOR']
    const errors = []
    
    if (!role) {
      errors.push('Role is required')
    } else if (!validRoles.includes(role.toUpperCase())) {
      errors.push(`Role must be one of: ${validRoles.join(', ')}`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // General form validation helper
  validateForm: (formData, validationRules) => {
    const fieldErrors = {}
    
    Object.keys(validationRules).forEach(fieldName => {
      const value = formData[fieldName]
      const rules = validationRules[fieldName]
      
      for (const rule of rules) {
        const validation = rule(value)
        if (!validation.isValid) {
          fieldErrors[fieldName] = validation.errors[0]
          break // Stop at first error for this field
        }
      }
    })
    
    return {
      isValid: Object.keys(fieldErrors).length === 0,
      errors: fieldErrors
    }
  }
}