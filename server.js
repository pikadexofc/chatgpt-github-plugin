const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

app.use(cors());
app.use(express.json());

function githubHeaders(extra = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
    ...extra
  };

  return headers;
}

async function githubFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: githubHeaders(options.headers || {})
  });

  const text = await response.text();
  if (!response.ok) {
    let payload = {};
    try {
      payload = JSON.parse(text);
    } catch {
      // ignore bad JSON
    }

    throw new Error(`GitHub API error (${response.status}): ${payload.message || text}`);
  }

  return text ? JSON.parse(text) : {};
}

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'github-chatgpt-plugin' });
});

app.get('/openapi.yaml', (req, res) => {
  const filePath = path.join(__dirname, 'openapi.yaml');
  res.sendFile(filePath);
});

app.get('/.well-known/ai-plugin.json', (req, res) => {
  const filePath = path.join(__dirname, '.well-known', 'ai-plugin.json');
  res.sendFile(filePath);
});

app.get('/github/search/repositories', async (req, res) => {
  try {
    const q = req.query.q || 'github';
    const perPage = Number(req.query.per_page || 5);

    const data = await githubFetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=${perPage}`
    );

    res.json({
      total_count: data.total_count,
      items: (data.items || []).map((repo) => ({
        id: repo.id,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count,
        language: repo.language,
        default_branch: repo.default_branch,
        open_issues_count: repo.open_issues_count
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/github/repos/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const data = await githubFetch(`https://api.github.com/repos/${owner}/${repo}`);

    res.json({
      full_name: data.full_name,
      description: data.description,
      html_url: data.html_url,
      default_branch: data.default_branch,
      stargazers_count: data.stargazers_count,
      open_issues_count: data.open_issues_count,
      language: data.language,
      private: data.private,
      updated_at: data.updated_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/github/repos/:owner/:repo/issues', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const state = req.query.state || 'open';
    const perPage = Number(req.query.per_page || 10);

    const data = await githubFetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=${perPage}`
    );

    res.json(
      (data || []).map((issue) => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        state: issue.state,
        user: issue.user ? issue.user.login : null,
        html_url: issue.html_url,
        created_at: issue.created_at
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/github/repos/:owner/:repo/pulls', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const state = req.query.state || 'open';
    const perPage = Number(req.query.per_page || 10);

    const data = await githubFetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&per_page=${perPage}`
    );

    res.json(
      (data || []).map((pr) => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        state: pr.state,
        user: pr.user ? pr.user.login : null,
        html_url: pr.html_url,
        created_at: pr.created_at,
        merged_at: pr.merged_at
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/github/repos/:owner/:repo/contents/:path(*)', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const requestedPath = req.params.path || '';
    const ref = req.query.ref || 'HEAD';

    const data = await githubFetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(requestedPath)}?ref=${encodeURIComponent(ref)}`
    );

    if (data.type === 'file') {
      const content = Buffer.from(data.content || '', 'base64').toString('utf8');
      res.json({
        path: data.path,
        sha: data.sha,
        size: data.size,
        download_url: data.download_url,
        content
      });
      return;
    }

    res.json({
      path: data.path,
      type: data.type,
      entries: Array.isArray(data) ? data : []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`GitHub plugin listening on http://localhost:${PORT}`);
});
