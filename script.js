// ================================
// BALA MOTORS - MAIN JAVASCRIPT
// ================================

const phoneNumber = "601117349896";
const googleSheetURL = "https://script.google.com/macros/s/AKfycbwOmQSXOwwOxRS_qa5Zpffw7MdLxygm4xkJQvwzRDeRjuIl6fSPmHWtS1dPz7DAS0Wt/exec";

// WAIT FOR DOM
document.addEventListener("DOMContentLoaded", function () {

    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            disable: 'mobile'
        });
    }

    // Contact Form Handler
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", function (e) {
            e.preventDefault();
            sendBookingToWhatsApp();
            return false; // Prevent any double submission
        });
        
        // Remove any existing event listeners (fix duplicate issue)
        contactForm.removeEventListener("submit", sendBookingToWhatsApp);
        contactForm.addEventListener("submit", function (e) {
            e.preventDefault();
            sendBookingToWhatsApp();
            return false;
        });
    }

    // Service Type Change Handler
    const serviceType = document.getElementById("serviceType");
    const availableServices = document.getElementById("availableServices");
    
    if (serviceType && availableServices) {
        serviceType.addEventListener("change", function () {
            updateAvailableServices(this.value);
        });
    }

    // Auto-close mobile navbar when link clicked
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    const navbarToggler = document.querySelector('.navbar-toggler');
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbarCollapse.classList.contains('show')) {
                navbarToggler.click();
            }
        });
    });
    
    // Phone number input validation (only allow numbers, +, -)
    const phoneInput = document.getElementById("phone");
    if (phoneInput) {
        phoneInput.addEventListener("input", function() {
            this.value = this.value.replace(/[^0-9+\-\s]/g, '');
        });
    }
});


// ================================
// TOGGLE CHAT
// ================================
function toggleChat() {
    const box = document.getElementById("chatBox");
    if (!box) return;

    if (box.style.display === "flex") {
        box.style.display = "none";
    } else {
        box.style.display = "flex";
        box.style.flexDirection = "column";
    }
}


// ================================
// QUICK CHAT REPLIES
// ================================
function sendQuick(issue) {
    const message = `💬 Bala Motors Quick Support\n\n⚠ Issue Type: ${issue}\n\n👉 Please describe your issue after opening chat.`;
    openWhatsApp(message);
}


// ================================
// OPEN WHATSAPP
// ================================
function openWhatsApp(message) {
    const url = "https://wa.me/" + phoneNumber + "?text=" + encodeURIComponent(message);
    window.open(url, "_blank");
}


// ================================
// SAVE TO GOOGLE SHEETS (Once only)
// ================================
let isSaving = false; // Prevent double save

function saveToGoogleSheets(bookingData) {
    if (isSaving) return; // Block if already saving
    isSaving = true;
    
    fetch(googleSheetURL, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData)
    })
    .then(response => {
        console.log("✅ Booking saved to Google Sheets!");
        isSaving = false;
    })
    .catch(error => {
        console.log("⚠️ Sheet save failed, but WhatsApp still sent:", error);
        isSaving = false;
    });
}


// ================================
// VALIDATE PHONE NUMBER
// ================================
function isValidPhone(phone) {
    // Remove all non-digits
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Check if it's a valid Malaysian or international number
    // Malaysian: 01XXXXXXXX, +601XXXXXXXX, 601XXXXXXXX
    // Minimum 9 digits, maximum 15 digits
    if (digitsOnly.length < 9 || digitsOnly.length > 15) {
        return false;
    }
    
    return true;
}


// ================================
// SEND BOOKING (Fixed - No Duplicate)
// ================================
let isSubmitting = false; // Global lock

function sendBookingToWhatsApp() {
    // Prevent double submission
    if (isSubmitting) return;
    isSubmitting = true;
    
    let name = document.getElementById("name")?.value.trim();
    let phone = document.getElementById("phone")?.value.trim();
    let serviceType = document.getElementById("serviceType")?.value;
    let serviceTypeText = document.getElementById("serviceType")?.selectedOptions[0]?.text || serviceType;
    let selectedService = document.getElementById("availableServices")?.value;
    let selectedServiceText = document.getElementById("availableServices")?.selectedOptions[0]?.text || selectedService;
    let issue = document.getElementById("issueDescription")?.value.trim();

    // Validate required fields
    if (!name) {
        alert("Please enter your name!");
        isSubmitting = false;
        return;
    }
    
    if (!phone) {
        alert("Please enter your phone number!");
        isSubmitting = false;
        return;
    }
    
    // Validate phone number
    if (!isValidPhone(phone)) {
        alert("Please enter a valid phone number! (Min 9 digits)");
        isSubmitting = false;
        return;
    }
    
    if (!serviceType) {
        alert("Please select a service type!");
        isSubmitting = false;
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector("#contactForm button[type='submit']");
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = "⏳ Sending...";
    submitBtn.disabled = true;

    // Prepare booking data for Google Sheets
    const bookingData = {
        name: name,
        phone: phone,
        serviceType: serviceTypeText,
        selectedService: selectedServiceText || "Not specified",
        issueDescription: issue || "Not specified"
    };

    // Save to Google Sheets (only once)
    saveToGoogleSheets(bookingData);

    // Prepare WhatsApp message
    let message = `🔧 *Bala Motors Service Booking*\n\n`;
    message += `👤 *Name:* ${name}\n`;
    message += `📞 *Phone:* ${phone}\n`;
    message += `🔧 *Service Type:* ${serviceTypeText}\n`;
    
    if (selectedService) {
        message += `🛠 *Selected Service:* ${selectedServiceText}\n`;
    }
    
    if (issue) {
        message += `📝 *Issue Description:* ${issue}\n`;
    }

    // Open WhatsApp after short delay
    setTimeout(() => {
        openWhatsApp(message);
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        isSubmitting = false;
        
        // Clear form
        document.getElementById("contactForm").reset();
        
        // Reset available services dropdown
        const availableSelect = document.getElementById("availableServices");
        if (availableSelect) {
            availableSelect.innerHTML = '<option value="">-- Available Services --</option>';
        }
    }, 800);
}


// ================================
// UPDATE AVAILABLE SERVICES
// ================================
function updateAvailableServices(serviceType) {
    const availableSelect = document.getElementById("availableServices");
    const issueSection = document.getElementById("issueSection");
    
    if (!availableSelect) return;

    const servicesData = {
        "major": [
            "Full Engine Tune-up",
            "Periodic Mileage Servicing",
            "Complete Bike Health Inspection",
            "Pre-Purchase Bike Inspection",
            "Post-Accident Assessment & Repair"
        ],
        "engine": [
            "Carburetor Tuning & Cleaning",
            "Carburetor Rebuild & Synchronization",
            "Fuel Injector Cleaning & Calibration",
            "Valve Clearance Adjustment",
            "Top-End Engine Overhaul",
            "Full Engine Rebuild"
        ],
        "wiring": [
            "Battery Diagnostics & Replacement",
            "Charging System Testing (Stator & Regulator)",
            "Custom Wiring Harness Installation",
            "Faulty Wiring Troubleshooting",
            "ECU Diagnostics & Error Code Reset",
            "Lighting & Indicator Repairs"
        ],
        "modification": [
            "Aftermarket Exhaust Installation",
            "Performance Parts Upgrades",
            "Custom Handlebar & Control Setups",
            "Body Kit & Accessory Fitting",
            "Frame Modification & Welding",
            "Custom Paint & Aesthetic Upgrades"
        ],
        "brake": [
            "Brake Pad & Shoe Replacement",
            "Brake Fluid Flush & Bleeding",
            "Brake Caliper & Master Cylinder Rebuild",
            "Fuel Tank Flushing & Cleaning",
            "Fuel Pump & Filter Replacement",
            "Fuel Line & Petcock Upgrades"
        ],
        "tires": [
            "Tire Mounting & Balancing",
            "Puncture Repair & Tube Replacement",
            "Wheel Alignment & Truing",
            "Spoke Tightening & Wheel Re-lacing",
            "Wheel Bearing Replacement"
        ],
        "suspension": [
            "Front Fork Oil Seal Replacement",
            "Rear Shock Absorber Upgrades",
            "Drive Chain Cleaning, Lubing & Tensioning",
            "Sprocket & Chain Kit Replacement",
            "Scooter CVT Belt & Roller Servicing"
        ],
        "misc": [
            "Track Day / Race Bike Preparation",
            "Ultrasonic Component Cleaning"
        ],
        "other": [
            "Other Service (Describe Below)"
        ]
    };

    let services = servicesData[serviceType] || [];

    // Clear existing options
    availableSelect.innerHTML = '<option value="">-- Available Services --</option>';

    // Add new options
    services.forEach(service => {
        let option = document.createElement("option");
        option.value = service;
        option.textContent = service;
        availableSelect.appendChild(option);
    });

    // Show issue section
    if (issueSection) {
        issueSection.style.display = "block";
    }
}


// ================================
// IMAGE SLIDER (HOMEPAGE)
// ================================
let currentSlide = 0;

function moveSlide(direction) {
    const slider = document.getElementById("imageSlider");
    if (!slider) return;
    
    const slides = slider.querySelectorAll("img");
    const slideWidth = slides[0].clientWidth + 20;
    
    currentSlide += direction;
    
    if (currentSlide < 0) {
        currentSlide = slides.length - 1;
    }
    if (currentSlide >= slides.length) {
        currentSlide = 0;
    }
    
    slider.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
}

// Auto slide every 4 seconds
setInterval(() => {
    const slider = document.getElementById("imageSlider");
    if (slider && document.hidden === false) {
        moveSlide(1);
    }
}, 4000);