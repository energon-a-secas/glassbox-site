.DEFAULT_GOAL := help

PORT = 8856  # glassbox-site (see scripts/repo-tools.sh)

# ── Help ──────────────────────────────────────────────────────────────────────
.PHONY: help
help:
	@echo ""
	@echo "  make serve    Start dev server → http://localhost:$(PORT)"
	@echo "  make kill     Kill this project's HTTP server"
	@echo ""

# ── Dev server ────────────────────────────────────────────────────────────────
.PHONY: serve
serve:
	@echo "Serving → http://localhost:$(PORT)"
	@if [ -f ../../scripts/serve.py ]; then python3 ../../scripts/serve.py $(PORT); else python3 -m http.server $(PORT); fi

# ── Kill ──────────────────────────────────────────────────────────────────────
.PHONY: kill
kill:
	@lsof -ti :$(PORT) | xargs kill 2>/dev/null && echo "Stopped server on port $(PORT)" || echo "No server running on port $(PORT)"

# ── Proctor export ────────────────────────────────────────────────────────────
# Regenerate proctor-drill.json (the bank in Proctor's format) after ANY edit
# to js/data/questions/ — the JSON is committed and drifts otherwise.
.PHONY: proctor
proctor:
	@node scripts/export-proctor.mjs
