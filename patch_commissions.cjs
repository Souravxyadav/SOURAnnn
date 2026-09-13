const fs = require("fs");
let js = fs.readFileSync("js/commissions.js", "utf8");

const oldInsert = `    // Standard payload with dual compatibility
    const standardPayload = {
      application_id: appId,
      amount: amount,
      payment_date: date,
      transaction_id: ref,
      reference_no: ref,
      payment_type: category,
      payment_method: mode,
      payment_mode: mode,
      received_by: collectedBy || "Admin",
      status: "Received",
      notes: formattedNotes,
      remarks: formattedNotes
    };

    let insertRes = await window.supabaseClient.from("application_payments").insert(standardPayload).select();
    
    if (insertRes.error) {
      console.warn("Primary payment insert warning, trying minimal fallback:", insertRes.error);
      const fallbackPayload = {
        application_id: appId,
        amount: amount,
        payment_date: date,
        payment_method: mode,
        status: "Received",
        notes: formattedNotes
      };
      const retryRes = await window.supabaseClient.from("application_payments").insert(fallbackPayload).select();
      if (retryRes.error) throw retryRes.error;
    }`;

const newInsert = `
    let insertRes;
    if (category === "Commission") {
      insertRes = await window.supabaseClient.from("commission_transactions").insert({
        application_id: appId,
        amount: amount,
        payment_date: date,
        payment_mode: mode,
        reference_no: ref,
        status: "Received",
        notes: formattedNotes
      }).select();
    } else {
      insertRes = await window.supabaseClient.from("application_payments").insert({
        application_id: appId,
        amount: amount,
        payment_date: date,
        payment_method: mode,
        transaction_id: ref,
        status: "Received",
        notes: formattedNotes
      }).select();
    }
    
    if (insertRes.error) throw insertRes.error;
`;

js = js.replace(oldInsert, newInsert);

fs.writeFileSync("js/commissions.js", js, "utf8");
console.log("Patched commissions insert");
