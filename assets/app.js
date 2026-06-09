(() => {
  const els = {
    search: document.getElementById('search'),
    chipBar: document.getElementById('chip-bar'),
    tbody: document.getElementById('treasure-tbody'),
    count: document.getElementById('result-count'),
    empty: document.getElementById('empty-state'),
    table: document.getElementById('treasure-table'),
    lightbox: document.getElementById('lightbox'),
    lightboxImg: document.getElementById('lightbox-img'),
    lightboxClose: document.getElementById('lightbox-close'),
  };

  const state = {
    rows: [],
    search: '',
    activeTags: new Set(),
    sortKey: null,
    sortDir: 'asc',
  };

  const naturalCmp = (a, b) =>
    String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });

  const getSortValue = (row, key) => {
    if (key === 'id') return row.id;
    if (key === 'x') return row.coords?.x ?? 0;
    if (key === 'y') return row.coords?.y ?? 0;
    return '';
  };

  const matchesSearch = (row, q) => {
    if (!q) return true;
    const haystack = [
      row.id,
      ...(row.tags || []),
      String(row.coords?.x ?? ''),
      String(row.coords?.y ?? ''),
    ].join(' ').toLowerCase();
    return haystack.includes(q);
  };

  const matchesTags = (row, active) => {
    if (active.size === 0) return true;
    return (row.tags || []).some(t => active.has(t));
  };

  const computeView = () => {
    const q = state.search.trim().toLowerCase();
    let view = state.rows.filter(r => matchesSearch(r, q) && matchesTags(r, state.activeTags));
    if (state.sortKey) {
      const dir = state.sortDir === 'asc' ? 1 : -1;
      view = view.slice().sort((a, b) => dir * naturalCmp(getSortValue(a, state.sortKey), getSortValue(b, state.sortKey)));
    }
    return view;
  };

  const renderChips = () => {
    const allTags = new Set();
    state.rows.forEach(r => (r.tags || []).forEach(t => allTags.add(t)));
    const sorted = [...allTags].sort();

    els.chipBar.innerHTML = '';
    sorted.forEach(tag => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip' + (state.activeTags.has(tag) ? ' active' : '');
      btn.textContent = tag;
      btn.setAttribute('aria-pressed', state.activeTags.has(tag) ? 'true' : 'false');
      btn.addEventListener('click', () => {
        if (state.activeTags.has(tag)) state.activeTags.delete(tag);
        else state.activeTags.add(tag);
        renderChips();
        renderRows();
      });
      els.chipBar.appendChild(btn);
    });

    if (state.activeTags.size > 0) {
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'chip clear';
      clear.textContent = 'clear filters';
      clear.addEventListener('click', () => {
        state.activeTags.clear();
        renderChips();
        renderRows();
      });
      els.chipBar.appendChild(clear);
    }
  };

  const renderRows = () => {
    const view = computeView();
    const frag = document.createDocumentFragment();

    view.forEach(row => {
      const tr = document.createElement('tr');

      const tdThumb = document.createElement('td');
      tdThumb.className = 'col-thumb';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'thumb-btn';
      btn.setAttribute('aria-label', `Enlarge photo ${row.id}`);
      const img = document.createElement('img');
      img.className = 'thumb';
      img.src = row.image;
      img.alt = `Treasure photo ${row.id}`;
      img.loading = 'lazy';
      btn.appendChild(img);
      btn.addEventListener('click', () => openLightbox(row.image, `Treasure photo ${row.id}`));
      tdThumb.appendChild(btn);

      const tdId = document.createElement('td');
      tdId.className = 'col-id';
      tdId.textContent = `#${row.id}`;

      const tdTags = document.createElement('td');
      tdTags.className = 'col-tags';
      const tagList = document.createElement('div');
      tagList.className = 'tag-list';
      (row.tags || []).forEach(t => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = t;
        tagList.appendChild(span);
      });
      tdTags.appendChild(tagList);

      const tdX = document.createElement('td');
      tdX.className = 'col-x';
      tdX.textContent = row.coords?.x ?? '';

      const tdY = document.createElement('td');
      tdY.className = 'col-y';
      tdY.textContent = row.coords?.y ?? '';

      const tdVideo = document.createElement('td');
      tdVideo.className = 'col-video';
      if (row.video) {
        const link = document.createElement('a');
        link.className = 'video-link';
        link.href = row.video;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'watch';
        tdVideo.appendChild(link);
      } else {
        tdVideo.innerHTML = '<span class="muted">&mdash;</span>';
      }

      tr.append(tdThumb, tdId, tdTags, tdX, tdY, tdVideo);
      frag.appendChild(tr);
    });

    els.tbody.replaceChildren(frag);
    els.empty.hidden = view.length > 0;
    els.count.textContent = `// showing ${view.length} of ${state.rows.length}`;
    updateSortIndicators();
  };

  const updateSortIndicators = () => {
    els.table.querySelectorAll('th.sortable').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.sort === state.sortKey) {
        th.classList.add(state.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
      }
    });
  };

  const wireSorting = () => {
    els.table.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (state.sortKey === key) {
          state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortKey = key;
          state.sortDir = 'asc';
        }
        renderRows();
      });
    });
  };

  const wireSearch = () => {
    els.search.addEventListener('input', e => {
      state.search = e.target.value;
      renderRows();
    });
  };

  const openLightbox = (src, alt) => {
    els.lightboxImg.src = src;
    els.lightboxImg.alt = alt;
    els.lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    els.lightboxClose.focus();
  };

  const closeLightbox = () => {
    if (els.lightbox.hidden) return;
    els.lightbox.hidden = true;
    els.lightboxImg.removeAttribute('src');
    document.body.style.overflow = '';
  };

  const wireLightbox = () => {
    els.lightboxClose.addEventListener('click', closeLightbox);
    els.lightbox.addEventListener('click', e => {
      if (e.target === els.lightbox) closeLightbox();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeLightbox();
    });
  };

  const showError = msg => {
    els.count.textContent = `// error: ${msg}`;
    els.empty.hidden = false;
    els.empty.textContent = `// ${msg}`;
  };

  const init = async () => {
    wireSorting();
    wireSearch();
    wireLightbox();
    try {
      const res = await fetch('./data.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.rows = await res.json();
      renderChips();
      renderRows();
    } catch (err) {
      showError(`failed to load data.json (${err.message}). serve over http, e.g. \`python -m http.server\``);
    }
  };

  init();
})();
