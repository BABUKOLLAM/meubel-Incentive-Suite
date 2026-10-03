// Served by the back end. Tells the board where its API lives. Absent (for example in the artifact preview or
// when index.html is opened from disk) the board runs on browser storage and sample data exactly as before.
window.BPRO_CONFIG = { api: '/api' };
