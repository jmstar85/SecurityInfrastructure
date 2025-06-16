// Security MCP Documentation JavaScript
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search");
    const navLinks = document.querySelectorAll(".nav-link");
    const exampleCards = document.querySelectorAll(".example-card");

    let currentCategory = "all";

    // Search functionality
    searchInput.addEventListener("input", function () {
        const query = this.value.toLowerCase();
        filterExamples(query, currentCategory);
    });

    // Category navigation
    navLinks.forEach((link) => {
        link.addEventListener("click", function (e) {
            e.preventDefault();

            // Update active nav link
            navLinks.forEach((l) => l.classList.remove("active"));
            this.classList.add("active");

            // Update current category
            currentCategory = this.dataset.category;

            // Filter examples
            const query = searchInput.value.toLowerCase();
            filterExamples(query, currentCategory);
        });
    });

    function filterExamples(query, category) {
        exampleCards.forEach((card) => {
            const title = card.querySelector("h3").textContent.toLowerCase();
            const description = card
                .querySelector(".example-description")
                .textContent.toLowerCase();
            const tags = card.dataset.tags.toLowerCase();
            const cardCategory = card.dataset.category;

            const matchesSearch =
                !query ||
                title.includes(query) ||
                description.includes(query) ||
                tags.includes(query);
            const matchesCategory =
                category === "all" || cardCategory === category;

            if (matchesSearch && matchesCategory) {
                card.classList.remove("hidden");
            } else {
                card.classList.add("hidden");
            }
        });
    }
});

// Copy code functionality
function copyCode(button) {
    const codeBlock = button.closest(".code-container").querySelector("code");
    const text = codeBlock.textContent;

    navigator.clipboard
        .writeText(text)
        .then(function () {
            const originalText = button.textContent;
            button.textContent = "Copied!";
            button.style.background = "#48bb78";

            setTimeout(function () {
                button.textContent = originalText;
                button.style.background = "#667eea";
            }, 2000);
        })
        .catch(function (err) {
            console.error("Failed to copy: ", err);
            button.textContent = "Copy failed";
            button.style.background = "#f56565";

            setTimeout(function () {
                button.textContent = "Copy";
                button.style.background = "#667eea";
            }, 2000);
        });
}
