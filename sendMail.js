window.onload = function() {
    // 1. Get the data saved by app.js
    const data = JSON.parse(localStorage.getItem("letterData"));
    
    if (data) {
        // 2. Fill in the spans in selection.html
        document.getElementById('name').innerText = data.name;
        document.getElementById('district').innerText = data.district;
        document.getElementById('phone').innerText = data.phone;
        document.getElementById('regNo').innerText = data.regNo;
        document.getElementById('circleDate').innerText = data.circleDate;
    }

    // 3. Make the button send the email via your server.js
    document.getElementById('sendBtn').onclick = async () => {
        const btn = document.getElementById('sendBtn');
        btn.innerText = "⏳ Sending...";
        btn.disabled = true;

        try {
            const response = await fetch('https://appl-r2if.onrender.com/send-mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: data.email, // This comes from your app.js data
                    name: data.name
                })
            });

            if (response.ok) {
                alert("✅ Email sent successfully!");
            } else {
                alert("❌ Failed to send email.");
            }
        } catch (err) {
            console.error(err);
            alert("❌ Server Error: Is your Node.js server running?");
        } finally {
            btn.innerText = "📧 Send Email";
            btn.disabled = false;
        }
    };
};