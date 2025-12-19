// Main JavaScript for Agri-Guide
// Handles navigation, mobile menu, and general UI interactions

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenu) {
        mobileMenu.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navMenu) {
                navMenu.classList.remove('active');
                mobileMenu.classList.remove('active');
            }
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Form input validation styling
    const inputs = document.querySelectorAll('.form-input, .form-select');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.checkValidity()) {
                this.classList.remove('error');
            } else {
                this.classList.add('error');
            }
        });

        input.addEventListener('input', function() {
            if (this.classList.contains('error') && this.checkValidity()) {
                this.classList.remove('error');
            }
        });
    });
});


