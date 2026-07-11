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
        const speedValue = 200;
        const inc = target / speedValue;

        const current = +counter.innerText;

        if (current < target) {
            counter.innerText = Math.ceil(current + inc);
            setTimeout(updateCount, 20);
        } else {
            counter.innerText = target;
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
    });
}, observerOptions);

counters.forEach(counter => observer.observe(counter));
