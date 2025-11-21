document.addEventListener('DOMContentLoaded', () => {

    /*==============================
        HEADER AUTO-HIDE ON SCROLL
    ==============================*/
    let lastScroll = 0;
    const header = document.querySelector('header');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > lastScroll && currentScroll > 100) {
            header.style.top = '-50px'; // hide
        } else {
            header.style.top = '0'; // show
        }
        lastScroll = currentScroll;

        // Trigger scroll animations
        
    });

    /*==============================
        SIDEBAR MENU TOGGLE
    ==============================*/
    const menuToggle = document.getElementById('menuToggle');
    const menuSidebar = document.getElementById('menuSidebar');

    menuToggle.addEventListener('click', () => {
        menuSidebar.classList.toggle('active');
    });

    // Close menu if clicking outside
    document.addEventListener('click', (e) => {
        if (!menuSidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            menuSidebar.classList.remove('active');
        }
    });

    /*==============================
        FAQ TOGGLE
    ==============================*/
    const faqToggles = document.querySelectorAll('.faq-toggle');

    faqToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const content = toggle.nextElementSibling;
            toggle.classList.toggle('active');
            if (toggle.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.padding = '1rem 1.5rem';
            } else {
                content.style.maxHeight = '0';
                content.style.padding = '0 1.5rem';
            }
        });
    });

    /*==============================
        SMOOTH SCROLL LINKS
    ==============================*/
    const smoothLinks = document.querySelector('main').querySelectorAll('a[href^="#"]');

    smoothLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            menuSidebar.classList.remove('active'); // close sidebar on click
        });
    });
    
    const menuLinks = menuSidebar.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', (e)=>{
            e.preventDefault();
            link.style.color = 'inherit';
            menuSidebar.classList.remove('active');
            link.style.color = 'var(--clr-hover)';
            link.style.textDecoration = 'underline';
            const linkTarget = link.getAttribute('href');
            document.querySelector(linkTarget).scrollIntoView( {behavior: 'smooth', block: 'start'})
        })
    })

    /*==============================
        SCROLL ANIMATIONS
        Triggered on every scroll
    ==============================*/
    function setupScrollReveal() {
        const animatedElements = document.querySelectorAll('.js-scroll-reveal');
        const observerOptions = {
            root: null, // Viewport is the root
            rootMargin: '0px',
            threshold: 0.1 // Start animation when 10% of element is visible
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                } else {
                    // Optional: remove 'active' to reset animation on scroll out
                    entry.target.classList.remove('active'); 
                }
            });
        }, observerOptions);

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }
    setupScrollReveal();


});
