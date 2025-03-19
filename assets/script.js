// Main JavaScript for site-wide functionality

document.addEventListener('DOMContentLoaded', function() {
    // Handle contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            // Simple validation
            if (!name || !email || !subject || !message) {
                alert('Please fill out all fields');
                return;
            }
            
            // In a real application, you would send this data to a server
            alert('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
        });
    }
    
    // Glitch effect animation interval
    setInterval(() => {
        const glitchElements = document.querySelectorAll('.glitch');
        glitchElements.forEach(el => {
            if (Math.random() > 0.95) {
                el.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
                setTimeout(() => {
                    el.style.transform = 'translate(0, 0)';
                }, 100);
            }
        });
    }, 500);
    
    // Handle year range slider on visualization page
    const yearRange = document.getElementById('yearRange');
    const selectedYear = document.getElementById('selectedYear');
    
    if (yearRange && selectedYear) {
        yearRange.addEventListener('input', function() {
            selectedYear.textContent = this.value;
            // The actual visualization update will be handled in d3-visualization.js
        });
    }
    
    // Add pixel animations to elements when they come into view
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.pixel-box, .menu a, .pixel-button');
        
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const isVisible = (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
            
            if (isVisible) {
                el.style.animation = 'none';
                setTimeout(() => {
                    el.style.animation = '';
                }, 10);
            }
        });
    };
    
    // Add scroll event listener for animations
    window.addEventListener('scroll', animateOnScroll);
    
    // Initialize animations
    animateOnScroll();
});