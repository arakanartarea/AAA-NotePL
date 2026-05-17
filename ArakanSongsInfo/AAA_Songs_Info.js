// စာမျက်နှာစတင်ချိန်တွင် အဆင်သင့်ဖြစ်စေရန် လုပ်ဆောင်ချက်များ
document.addEventListener("DOMContentLoaded", function() {
    
    const myProfileBtn = document.getElementById("myProfileBtn");
    const userAuthBtn = document.getElementById("userAuthBtn");

    // UI အခြေအနေကို ပြောင်းလဲပေးမည့် လုပ်ဆောင်ချက်
    function updateAuthUI() {
        const savedEmail = localStorage.getItem("user_email");
        const savedPicture = localStorage.getItem("user_picture");
        
        if (savedEmail && savedPicture) {
            // အကောင့်ဝင်ထားလျှင် Google မေးလ်ထဲက ပရိုဖိုင်ပုံအစစ်ကို ပြပေးမည်
            userAuthBtn.innerHTML = `<img src="${savedPicture}" class="user-avatar-img" alt="User" referrerPolicy="no-referrer">`;
        } else {
            // အကောင့်မဝင်ရသေးလျှင် မူလ သော့ပုံစံ ပြန်ထားမည်
            userAuthBtn.innerHTML = `<span id="userStatusIcon">🔑</span>`;
        }
    }

    // Google သို့ တိုက်ရိုက် Login ခေါ်ယူမည့် လုပ်ဆောင်ချက်
    function handleGoogleLogin() {
        google.accounts.id.initialize({
            client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com", // ကိုကို့ Client ID ထည့်ရန်
            callback: function(response) {
                // ရလာသော JWT Token ထဲမှ အကောင့်အချက်အလက်များကို ဖြည်ထုတ်ခြင်း
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const user = JSON.parse(jsonPayload);
                
                // LocalStorage တွင် သိမ်းဆည်းခြင်း
                localStorage.setItem("user_email", user.email);
                localStorage.setItem("user_picture", user.picture); // Google ပရိုဖိုင်ပုံ Link
                
                updateAuthUI();
            }
        });
        google.accounts.id.prompt(); // Google Login Box ကို တိုက်ရိုက် ဖွင့်ပေးမည်
    }

    // ဘယ်ဘက်စွန် ကိုကို့ Profile Icon
    if (myProfileBtn) {
        myProfileBtn.addEventListener("click", function() {
            alert("ကိုကို့ပရိုဖိုင်ကို မကြာမီ စနစ်တကျ ပြသပေးပါမည်။");
        });
    }

    // ညာဘက်စွန် Login ခလုတ်ကို နှိပ်သည့်အခါ
    if (userAuthBtn) {
        userAuthBtn.addEventListener("click", function() {
            const currentEmail = localStorage.getItem("user_email");

            if (currentEmail) {
                // အကောင့်ထွက်ရန် လှမ်းမေးခြင်း
                if (confirm(`${currentEmail} အကောင့်မှ ထွက်လိုပါသလားရှင်။`)) {
                    localStorage.removeItem("user_email");
                    localStorage.removeItem("user_picture");
                    updateAuthUI();
                }
            } else {
                // အကောင့်မရှိသေးလျှင် Google Login ဖွင့်ပေးမည်
                handleGoogleLogin();
            }
        });
    }

    // အခြား Browser Tab များတွင် အပြောင်းအလဲဖြစ်ပါက ချက်ချင်း သိရှိစေရန်
    window.addEventListener("storage", function(event) {
        if (event.key === "user_email") {
            updateAuthUI();
        }
    });

    // စာမျက်နှာစဖွင့်ချင်း UI ကို စစ်ဆေးရန်
    updateAuthUI();
});
