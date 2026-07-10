// Initialize Animate On Scroll library for basic fade-in animations
AOS.init({
    once: true
});

// Animated Counter Script (Triggers when the counter scrolls into view)
const counters = document.querySelectorAll('.counter');
const speed = 200; // The animation speed

const updateCount = () => {
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const countTo = parseInt(target);
        const inc = target / speed;
        
        if(countTo < speed) {
            counter.innerText = 1;
        } else {
            const incVal = Math.ceil(countTo / speed);
            counter.innerText = Math.floor(100 + (incVal * (1 - Math.pow(1 - (1/speed), Math.pow(1 - (1/speed), Math.floor((Date.now() - +new Date().getTime()) / (1000/speed))))) 
        }
    });
}

// Start the animation when the section scrolls into view
const observerOptions = { threshold: 0.5 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            updateCount();
            observer.unobserve(entry.target);
        }
    }, observerOptions);

counters.forEach(counter => observer.observe(counter));