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
            return false;
        });
        
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
    
    // Phone number input validation (ALLOW ONLY NUMBERS)
    const phoneInput = document.getElementById("phone");
    if (phoneInput) {
        phoneInput.addEventListener("input", function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length > 15) {
                this.value = this.value.slice(0, 15);
            }
        });
    }

    // ---- NEW: Set Minimum Date to Today ----
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const dateFromInput = document.getElementById("preferredDateFrom");
    const dateToInput = document.getElementById("preferredDateTo");
    
    if (dateFromInput) dateFromInput.setAttribute("min", todayString);
    if (dateToInput) dateToInput.setAttribute("min", todayString);

    // ---- NEW: Event Listeners for Date/Time Changes to Block Past Times ----
    const timeFromInput = document.getElementById("preferredTimeFrom");
    const timeToInput = document.getElementById("preferredTimeTo");

    if (dateFromInput) dateFromInput.addEventListener("change", checkPastTime);
    if (timeFromInput) timeFromInput.addEventListener("change", checkPastTime);
    if (timeToInput) timeToInput.addEventListener("change", checkPastTime);
    if (dateToInput) dateToInput.addEventListener("change", checkPastTime);
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
// SAVE TO GOOGLE SHEETS
// ================================
let isSaving = false;

function saveToGoogleSheets(bookingData) {
    if (isSaving) return;
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
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 9 || digitsOnly.length > 15) {
        return false;
    }
    return true;
}


// ================================
// TOGGLE TIME SELECTION (Mutual Exclusivity)
// ================================
function toggleTimeSelection() {
    const flexibleCheckbox = document.getElementById("flexibleTime");
    const dateFrom = document.getElementById("preferredDateFrom");
    const dateTo = document.getElementById("preferredDateTo");
    const timeFrom = document.getElementById("preferredTimeFrom");
    const timeTo = document.getElementById("preferredTimeTo");
    const errorDiv = document.getElementById("timeError");
    const warningDiv = document.getElementById("pastTimeWarning");

    if (errorDiv) errorDiv.style.display = "none";
    if (warningDiv) warningDiv.style.display = "none";

    if (flexibleCheckbox.checked) {
        dateFrom.disabled = true;
        dateTo.disabled = true;
        timeFrom.disabled = true;
        timeTo.disabled = true;
        dateFrom.value = "";
        dateTo.value = "";
        timeFrom.value = "";
        timeTo.value = "";
    } else {
        dateFrom.disabled = false;
        dateTo.disabled = false;
        timeFrom.disabled = false;
        timeTo.disabled = false;
    }
}


// ================================
// NEW: CHECK FOR PAST TIME
// ================================
function checkPastTime() {
    const dateFrom = document.getElementById("preferredDateFrom").value;
    const timeFrom = document.getElementById("preferredTimeFrom").value;
    const dateTo = document.getElementById("preferredDateTo").value;
    const timeTo = document.getElementById("preferredTimeTo").value;
    const warningDiv = document.getElementById("pastTimeWarning");

    if (!warningDiv) return;

    const now = new Date();
    let hasPastTime = false;

    // Check From Date/Time
    if (dateFrom && timeFrom) {
        const selectedFrom = new Date(`${dateFrom}T${timeFrom}`);
        if (selectedFrom < now) {
            hasPastTime = true;
            document.getElementById("preferredTimeFrom").value = ""; // clear invalid time
        }
    }

    // Check To Date/Time
    if (dateTo && timeTo) {
        const selectedTo = new Date(`${dateTo}T${timeTo}`);
        if (selectedTo < now) {
            hasPastTime = true;
            document.getElementById("preferredTimeTo").value = ""; // clear invalid time
        }
    }

    // Also check if 'To' is before 'From'
    if (dateFrom && dateTo && timeFrom && timeTo) {
        const start = new Date(`${dateFrom}T${timeFrom}`);
        const end = new Date(`${dateTo}T${timeTo}`);
        if (end < start) {
            hasPastTime = true;
            document.getElementById("preferredTimeTo").value = "";
            warningDiv.textContent = "⚠️ 'To' date/time cannot be before 'From' date/time.";
        } else {
            warningDiv.textContent = "⚠️ Past time is not allowed. Please select a time from now onwards.";
        }
    }

    if (hasPastTime) {
        warningDiv.style.display = "block";
    } else {
        warningDiv.style.display = "none";
    }
}


// ================================
// VALIDATE TIME SELECTION
// ================================
function validateTimeSelection() {
    const flexibleCheckbox = document.getElementById("flexibleTime");
    const dateFrom = document.getElementById("preferredDateFrom");
    const dateTo = document.getElementById("preferredDateTo");
    const timeFrom = document.getElementById("preferredTimeFrom");
    const timeTo = document.getElementById("preferredTimeTo");
    const errorDiv = document.getElementById("timeError");

    if (flexibleCheckbox.checked) return true;

    if (!dateFrom.value || !dateTo.value || !timeFrom.value || !timeTo.value) {
        if (errorDiv) errorDiv.style.display = "block";
        return false;
    }

    // Final check: ensure no past time is sneaking through
    const now = new Date();
    const start = new Date(`${dateFrom.value}T${timeFrom.value}`);
    const end = new Date(`${dateTo.value}T${timeTo.value}`);

    if (start < now || end < now || end < start) {
        if (errorDiv) {
            errorDiv.textContent = "⚠️ Invalid time range. Please select a valid future time.";
            errorDiv.style.display = "block";
        }
        return false;
    }

    if (errorDiv) errorDiv.style.display = "none";
    return true;
}


// ================================
// CALCULATE ESTIMATED PRICE
// ================================
function calculateEstimate() {
    const serviceSelect = document.getElementById("availableServices");
    const estimateBox = document.getElementById("estimateBox");
    const estimatePrice = document.getElementById("estimatePrice");

    if (!serviceSelect || !estimateBox || !estimatePrice) return;

    const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];

    if (!selectedOption || selectedOption.value === "") {
        estimateBox.style.display = "none";
        return;
    }

    const price = selectedOption.getAttribute("data-price");

    if (price && price > 0) {
        estimatePrice.textContent = `RM ${price}`;
        estimateBox.style.display = "flex";
    } else {
        estimateBox.style.display = "none";
    }
}


// ================================
// UPDATE AVAILABLE SERVICES (With Prices)
// ================================
function updateAvailableServices(serviceType) {
    const availableSelect = document.getElementById("availableServices");
    const issueSection = document.getElementById("issueSection");
    const estimateBox = document.getElementById("estimateBox");
    
    if (!availableSelect) return;

    const servicesData = {
        "major": [
            { name: "Full Engine Tune-up", price: 150 },
            { name: "Periodic Mileage Servicing", price: 80 },
            { name: "Complete Bike Health Inspection", price: 50 },
            { name: "Pre-Purchase Bike Inspection", price: 60 },
            { name: "Post-Accident Assessment & Repair", price: 100 }
        ],
        "engine": [
            { name: "Carburetor Tuning & Cleaning", price: 60 },
            { name: "Carburetor Rebuild & Synchronization", price: 120 },
            { name: "Fuel Injector Cleaning & Calibration", price: 150 },
            { name: "Valve Clearance Adjustment", price: 80 },
            { name: "Top-End Engine Overhaul", price: 300 },
            { name: "Full Engine Rebuild", price: 800 }
        ],
        "wiring": [
            { name: "Battery Diagnostics & Replacement", price: 40 },
            { name: "Charging System Testing", price: 50 },
            { name: "Custom Wiring Harness Installation", price: 150 },
            { name: "Faulty Wiring Troubleshooting", price: 70 },
            { name: "ECU Diagnostics & Error Code Reset", price: 90 },
            { name: "Lighting & Indicator Repairs", price: 30 }
        ],
        "modification": [
            { name: "Aftermarket Exhaust Installation", price: 80 },
            { name: "Performance Parts Upgrades", price: 200 },
            { name: "Custom Handlebar & Control Setups", price: 100 },
            { name: "Body Kit & Accessory Fitting", price: 150 },
            { name: "Frame Modification & Welding", price: 250 },
            { name: "Custom Paint & Aesthetic Upgrades", price: 300 }
        ],
        "brake": [
            { name: "Brake Pad & Shoe Replacement", price: 50 },
            { name: "Brake Fluid Flush & Bleeding", price: 60 },
            { name: "Brake Caliper & Master Cylinder Rebuild", price: 120 },
            { name: "Fuel Tank Flushing & Cleaning", price: 80 },
            { name: "Fuel Pump & Filter Replacement", price: 100 },
            { name: "Fuel Line & Petcock Upgrades", price: 70 }
        ],
        "tires": [
            { name: "Tire Mounting & Balancing", price: 40 },
            { name: "Puncture Repair & Tube Replacement", price: 25 },
            { name: "Wheel Alignment & Truing", price: 60 },
            { name: "Spoke Tightening & Wheel Re-lacing", price: 80 },
            { name: "Wheel Bearing Replacement", price: 70 }
        ],
        "suspension": [
            { name: "Front Fork Oil Seal Replacement", price: 120 },
            { name: "Rear Shock Absorber Upgrades", price: 200 },
            { name: "Drive Chain Cleaning, Lubing & Tensioning", price: 30 },
            { name: "Sprocket & Chain Kit Replacement", price: 150 },
            { name: "Scooter CVT Belt & Roller Servicing", price: 90 }
        ],
        "misc": [
            { name: "Track Day / Race Bike Preparation", price: 300 },
            { name: "Ultrasonic Component Cleaning", price: 80 }
        ],
        "other": [
            { name: "Other Service (Describe Below)", price: 0 }
        ]
    };

    let services = servicesData[serviceType] || [];

    availableSelect.innerHTML = '<option value="">-- Available Services --</option>';

    services.forEach(service => {
        let option = document.createElement("option");
        option.value = service.name;
        option.textContent = service.name;
        option.setAttribute("data-price", service.price);
        availableSelect.appendChild(option);
    });

    if (estimateBox) estimateBox.style.display = "none";
    if (issueSection) issueSection.style.display = "block";
}


// ================================
// SEND BOOKING TO WHATSAPP
// ================================
let isSubmitting = false;

function sendBookingToWhatsApp() {
    if (isSubmitting) return;
    isSubmitting = true;
    
    let name = document.getElementById("name")?.value.trim();
    let phone = document.getElementById("phone")?.value.trim();
    let serviceType = document.getElementById("serviceType")?.value;
    let serviceTypeText = document.getElementById("serviceType")?.selectedOptions[0]?.text || serviceType;
    let selectedService = document.getElementById("availableServices")?.value;
    let selectedServiceText = document.getElementById("availableServices")?.selectedOptions[0]?.text || selectedService;
    let estimatePrice = document.getElementById("estimatePrice")?.textContent || "RM 0";
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

    // Validate Time Selection
    if (!validateTimeSelection()) {
        isSubmitting = false;
        document.getElementById("timeError").scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector("#contactForm button[type='submit']");
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = "⏳ Sending...";
    submitBtn.disabled = true;

    // Prepare preferred time string
    const flexibleCheckbox = document.getElementById("flexibleTime");
    let preferredTimeString = "";

    if (flexibleCheckbox.checked) {
        preferredTimeString = "Flexible (Whenever I am free)";
    } else {
        const dateFrom = document.getElementById("preferredDateFrom").value;
        const dateTo = document.getElementById("preferredDateTo").value;
        const from = document.getElementById("preferredTimeFrom").value;
        const to = document.getElementById("preferredTimeTo").value;
        preferredTimeString = `${dateFrom} (${from}) to ${dateTo} (${to})`;
    }

    // Prepare booking data for Google Sheets
    const bookingData = {
        name: name,
        phone: phone.replace(/\+/g, ''),
        serviceType: serviceTypeText,
        selectedService: selectedServiceText || "Not specified",
        estimatedPrice: estimatePrice,
        preferredTime: preferredTimeString,
        issueDescription: issue || "Not specified"
    };

    // Save to Google Sheets
    saveToGoogleSheets(bookingData);

    // Prepare WhatsApp message
    let message = `🔧 *Bala Motors Service Booking*\n\n`;
    message += `👤 *Name:* ${name}\n`;
    message += `📞 *Phone:* ${phone}\n`;
    message += `🔧 *Service Type:* ${serviceTypeText}\n`;
    
    if (selectedService) {
        message += `🛠 *Selected Service:* ${selectedServiceText}\n`;
        message += `💰 *Est. Price:* ${estimatePrice}\n`;
    }

    message += `⏰ *Preferred Time:* ${preferredTimeString}\n`;
    
    if (issue) {
        message += `📝 *Issue Description:* ${issue}\n`;
    }

    // Open WhatsApp after short delay
    setTimeout(() => {
        openWhatsApp(message);
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        isSubmitting = false;
        
        document.getElementById("contactForm").reset();
        
        const availableSelect = document.getElementById("availableServices");
        if (availableSelect) {
            availableSelect.innerHTML = '<option value="">-- Available Services --</option>';
        }
        
        // Reset all UI elements
        document.getElementById("estimateBox").style.display = "none";
        document.getElementById("flexibleTime").checked = false;
        toggleTimeSelection();
        document.getElementById("timeError").style.display = "none";
        document.getElementById("pastTimeWarning").style.display = "none";
        
    }, 800);
}