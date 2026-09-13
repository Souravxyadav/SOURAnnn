const fs = require('fs');
let html = fs.readFileSync('helpdesk.html', 'utf8');

const newModal = `  <!-- ADMIN REPLY MODAL -->
  <div id="reply-modal" class="fixed inset-0 z-50 flex items-center justify-center hidden">
    <div onclick="closeReplyModal()" class="absolute inset-0 bg-ink-900/60 backdrop-blur-sm"></div>
    <div class="relative bg-white w-full max-w-2xl mx-4 rounded-2xl shadow-xl p-0 border border-ink-100 z-10 max-h-[90vh] flex flex-col overflow-hidden">
      
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-ink-100 p-6 bg-ink-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-ink-100 flex items-center justify-center text-xl">✨</div>
          <div>
            <h3 class="font-bold text-base text-ink-900">Coordinator Reply</h3>
            <p class="text-xs text-ink-500">Draft your official response</p>
          </div>
        </div>
        <button onclick="closeReplyModal()" class="p-2 rounded-xl text-ink-400 hover:text-ink-800 hover:bg-ink-100 transition">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Student & Question Context Box -->
        <div class="pl-4 border-l-2 border-ink-100 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <span id="reply-student-name" class="font-bold text-ink-900 text-sm block">Student Name</span>
              <span id="reply-student-info" class="text-ink-500 text-[11px] block mt-0.5">Mobile: —</span>
            </div>
            <span id="reply-category-badge" class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-ink-50 text-ink-600 border border-ink-100">
              Category
            </span>
          </div>
          
          <div id="reply-scheme-container" class="text-[11px] text-ink-500 font-medium">
            Scheme: <span id="reply-scheme-name">Scheme Name</span>
          </div>
          
          <div class="pt-1">
            <p id="reply-student-message" class="text-ink-800 text-sm whitespace-pre-line leading-relaxed">
              Question text...
            </p>
          </div>
        </div>

        <!-- Reply Form -->
        <form id="reply-form" onsubmit="handleSendReply(event)" class="space-y-4">
          <input type="hidden" id="reply-message-id" value="">
          
          <div class="space-y-2">
            <label class="block text-xs font-bold text-ink-900">Your Official Response</label>
            <textarea id="reply-content" rows="5" required class="w-full rounded-xl border border-ink-200 p-4 text-sm outline-none focus:border-gold-500 font-sans shadow-xs" placeholder="Type your clear advice, resolution instructions, or status update for the student…"></textarea>
          </div>

          <!-- Quick Template Responses -->
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-2">
              Quick Insert
            </label>
            <div class="flex flex-wrap gap-2">
              <button type="button" onclick="insertQuickTemplate('under_verification')" class="px-3 py-1.5 bg-ink-50 hover:bg-ink-100 border border-ink-100 text-ink-700 rounded-lg text-xs transition">
                Under Verification
              </button>
              <button type="button" onclick="insertQuickTemplate('dbt_queued')" class="px-3 py-1.5 bg-ink-50 hover:bg-ink-100 border border-ink-100 text-ink-700 rounded-lg text-xs transition">
                DBT Batch Queued
              </button>
              <button type="button" onclick="insertQuickTemplate('doc_correction')" class="px-3 py-1.5 bg-ink-50 hover:bg-ink-100 border border-ink-100 text-ink-700 rounded-lg text-xs transition">
                Document Re-upload
              </button>
              <button type="button" onclick="insertQuickTemplate('portal_approved')" class="px-3 py-1.5 bg-ink-50 hover:bg-ink-100 border border-ink-100 text-ink-700 rounded-lg text-xs transition">
                Sanction Approved
              </button>
            </div>
          </div>
        </form>
      </div>

      <div class="border-t border-ink-100 p-6 bg-ink-50/50 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-ink-700">Mark as:</label>
          <select id="reply-status-select" class="rounded-lg border border-ink-200 px-3 py-1.5 text-xs outline-none bg-white font-medium shadow-xs">
            <option value="Responded">Responded</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        <div class="flex items-center gap-3">
          <button type="button" onclick="closeReplyModal()" class="px-4 py-2 border border-ink-200 text-ink-600 hover:bg-white text-xs font-semibold rounded-xl transition shadow-xs bg-ink-50">
            Cancel
          </button>
          <button type="submit" form="reply-form" id="btn-submit-reply" class="px-5 py-2 bg-ink-900 hover:bg-gold-500 hover:text-ink-950 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2">
            <span>Send Reply</span>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>`;

html = html.replace(/<!-- ADMIN REPLY MODAL -->[\s\S]*?<\/div>\n  <\/div>/, newModal);
fs.writeFileSync('helpdesk.html', html);
console.log("Patched helpdesk modal");
