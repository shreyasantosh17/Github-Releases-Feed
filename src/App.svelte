<script lang="ts">
  // https://docs.github.com/en/graphql
  // https://graphql-kit.com/graphql-voyager/

  import { onMount } from 'svelte'
  import { Octokit } from '@octokit/core'
  import { RequestError } from '@octokit/request-error'
  import { intlFormatDistance } from 'date-fns'
  import { query, type GithubResponse, type ReleaseObj } from './github'

  let githubToken: string | null = $state(null)
  let githubTokenInput: HTMLInputElement | undefined = $state()
  let octokit: Octokit | undefined

  const allReleases: ReleaseObj[] = $state([])
  let loading = $state(true)
  let progress = $state(0.0)
  let toast = $state('')

  let reposProcessed = 0
  let retries = 0

  const now = new Date()
  const startingDate = new Date(now)
  startingDate.setMonth(now.getMonth() - 3)

  const starsFormatter = new Intl.NumberFormat('en', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumSignificantDigits: 3,
  })

  function fetchGithubToken(): void {
    githubToken = localStorage.getItem('githubToken')
  }

  function saveGithubToken(): void {
    if (!githubTokenInput) return

    githubToken = githubTokenInput.value
    if (!githubToken) return

    localStorage.setItem('githubToken', githubToken)
    initOktokit()
    fetchReleases()
  }

  function initOktokit(): void {
    if (githubToken === null) return
    octokit = new Octokit({ auth: githubToken })
  }

  function fetchReleases(cursor: string | null = null): void {
    if (!octokit) return

    octokit
      .graphql<GithubResponse | undefined>(query, { cursor })
      .then((response) => {
        if (!response) {
          fetchReleases(cursor)
          return
        }

        // Reset retries since this request succeeded
        retries = 0

        const { pageInfo, totalCount, nodes } =
          response.viewer.starredRepositories

        nodes.forEach((repoNode) => {
          const { releases, ...repo } = repoNode
          const releaseNodes = releases.nodes

          releaseNodes.forEach((releaseNode) => {
            const publishedAt = new Date(releaseNode.publishedAt)
            if (publishedAt < startingDate) return
            allReleases.push({ repo, ...releaseNode })
          })

          allReleases.sort((a, b) => {
            const date1 = new Date(a.publishedAt).getTime()
            const date2 = new Date(b.publishedAt).getTime()
            return date2 - date1
          })

          reposProcessed += 1
          progress = reposProcessed / totalCount
        })

        if (response.rateLimit.remaining <= 0) {
          toast = 'Error: Reached Github Rate Limit'
          loading = false
        } else if (pageInfo.hasNextPage) {
          fetchReleases(pageInfo.endCursor)
        } else {
          loading = false
        }
      })
      .catch((error: unknown) => {
        console.log(error)

        if (retries < 3) {
          // Retry the same request up to 3 times
          retries += 1
          console.log(`Retrying Request - Retry #${retries}`)
          fetchReleases(cursor)
        } else if (error instanceof RequestError) {
          console.log(error.status)
          console.log(error.message)
          console.log(error.response)
          toast = error.message
        }
      })
  }

  onMount(() => {
    fetchGithubToken()
    initOktokit()
    fetchReleases()
  })
</script>

{#if githubToken}
  {#if loading}
    {#if progress > 0}
      <div id="progress">
        <span style="width: {progress * 100}%;"></span>
      </div>
    {:else}
      <div id="loading">
        <img
          src="./loading.svg"
          alt="Loading..."
        />
      </div>
    {/if}
  {/if}

  <div id="releases">
    {#each allReleases as release (release.id)}
      {@const repo = release.repo}
      {@const owner = repo.owner}
      {@const licenseInfo = repo.licenseInfo}

      <div class="release">
        <div class="info">
          <div class="pill stars">
            <span>&#10025;</span>
            {starsFormatter.format(repo.stargazerCount)}
          </div>

          <div class="pill license">
            <span>&#169;</span>

            {#if licenseInfo}
              {#if licenseInfo.spdxId === 'NOASSERTION'}
                Unspecified
              {:else}
                {licenseInfo.spdxId}
              {/if}
            {:else}
              Unknown
            {/if}
          </div>

          <div class="avatar">
            <img
              src={owner.avatarUrl}
              alt="Avatar"
              loading="lazy"
            />
          </div>

          <div class="repo">
            <a
              href={owner.url}
              target="_blank">{owner.login}</a
            >/<a
              href={repo.url}
              target="_blank"
              title={repo.description}>{repo.name}</a
            > released
          </div>

          <div class="time">
            {intlFormatDistance(release.publishedAt, new Date())}
          </div>
        </div>

        <div class="name">
          <a
            href={release.url}
            target="_blank">{release.name}</a
          >

          {#if release.isPrerelease || release.isDraft}
            <span class="pill status">
              {#if release.isPrerelease}
                Prerelease
              {:else if release.isDraft}
                Draft
              {/if}
            </span>
          {/if}
        </div>

        <div class="description">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html release.descriptionHTML}
        </div>

        <div class="meta">
          {#each repo.languages.nodes as languageNode}
            {@const secondary = languageNode.id !== repo.primaryLanguage.id}
            <div
              class="pill lang"
              class:secondary
            >
              {languageNode.name}
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
{:else}
  <div id="login">
    <div>
      <input
        type="text"
        placeholder="github_pat_..."
        bind:this={githubTokenInput}
      />
      <button onclick={saveGithubToken}>Load</button>
    </div>

    <div>
      <details name="faq">
        <summary>What does this service do? Why does it exist?</summary>
        <p>
          The Github activity feed that shows when you first log in is
          notoriously broken. Sometimes is shows everything it should, sometimes
          it shows nothing, and most times it shows something in between. It is
          almost impossible to get a reliable list of all recent releases for
          starred repositories.
        </p>
        <p>
          This service was created to resolve that issue. You provide a Github
          Personal Access Token which has read-only access your starred
          repositories, and it will then fetch the last 3 months of releases for
          those repositories, displaying them from newest to oldest. No fancy
          algorithms or predictions getting in the way; the way all activity
          feeds should be.
        </p>
      </details>

      <details name="faq">
        <summary>How does this service work? What are the limitations?</summary>
        <p>
          After you provide a Github Personal Access Token with read-only access
          to your starred repositories, it uses that token in conjunction with
          Github's oktokit.js package to make requests to Github's GraphQL API.
          It fetches your starred repositories along with their releases, and
          then loops over, processes, and displays the results in a clear and
          informative way. The Github Personal Access Token is saved in the
          browsers local storage so that you do not need to keep providing it
          each time you access this service.
        </p>
        <p>
          Because of limitations with Github's GraphQL API, this service cannot
          fetch all releases at once. Instead, it needs to fetch releases in
          small batches (currently 5 because fetching more seems to result in
          network timeouts). Each batch is then added to the results set, and
          re-sorted by release date. Therefore, as more results trickle in, the
          feed jumps around until all results are loaded. It is recommended to
          wait until the loading bar reaches 100% before scrolling the feed so
          as not miss anything.
        </p>
      </details>

      <details name="faq">
        <summary>Do you need access to my Github account? Is this safe?</summary
        >
        <p>
          We will never ask for your email and password. Instead, this service
          uses Github's Personal Access Token functionality. The token you
          supply is stored in your browsers local storage; we never see it
          because it never leaves your computer. Additionally, we recommend
          using Github's fine-grained access tokens, which allow you to limit
          the tokens ability to allow only read-only access to the repositories
          you have starred.
        </p>
        <p>
          This service is also open-sourced, available <a
            href="https://github.com/KieranP/Github-Releases-Feed"
            target="_blank">here</a
          >. So you can examine exactly what the service does should you
          continue to have questions about security. You can download and run
          the service locally. And you can make changes to enhance the service
          should you wish (we'd love a Pull Request that improves performance).
        </p>
      </details>

      <details
        name="faq"
        open
      >
        <summary>How do I generate a Github Personal Access Token?</summary>
        <p>
          Start by creating a <a
            href="https://github.com/settings/personal-access-tokens/new"
            target="_blank">Fine-grained Personal Access Token</a
          >. Set whatever value you want for the token name and expiration.
          Under "Permissions > Account permissions > Starring", set that
          permission to "Access: Read-only". Leave all other settings as their
          default. Click "Generate token". Then copy the resulting token into
          the box above and click "Load".
        </p>
      </details>
    </div>
  </div>
{/if}

{#if toast}
  <div id="toast">
    {toast}
  </div>
{/if}

<style lang="scss">
  #login {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;

    input,
    button {
      margin: 0;
      padding: 5px 10px;
      line-height: 35px;
      font-size: 20px;
    }

    input {
      width: 79%;
    }

    button {
      width: 20%;
    }

    details {
      margin: 20px 0;

      summary {
        cursor: pointer;
      }
    }
  }

  #loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    img {
      width: 120px;
    }
  }

  #progress {
    position: fixed;
    top: 0;
    left: 50%;
    transform: translate(-50%, 0);
    margin: 0;
    width: 1000px;
    background-color: #eee;

    span {
      display: inline-block;
      margin: 0;
      height: 10px;
      background-color: green;
    }
  }

  #releases {
    width: 1000px;
    margin: 0 auto;

    .release {
      margin: 20px 0;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 7px;
      background-color: #fdfdfd;
      filter: drop-shadow(5px 5px 5px #ccc);

      .pill {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 10px;
        background-color: #555;
        color: white;
        line-height: 13px;
        font-size: 13px;

        span {
          display: inline-block;
          margin-right: 2px;
          color: rgba(255, 255, 0, 0.938);
        }
      }

      .info {
        a {
          color: black;
        }

        .stars,
        .license {
          float: right;
          margin-left: 5px;
        }

        .avatar {
          float: left;
          margin-right: 10px;

          img {
            width: 40px;
            height: 40px;
            border-radius: 7px;
          }
        }

        .time {
          margin-top: 5px;
          font-size: 13px;
        }
      }

      .name {
        margin: 20px 0;
        font-size: 24px;
        font-weight: bold;

        .status {
          font-size: 14px;
          font-weight: normal;
        }
      }

      .description {
        margin-block: 20px;

        :global {
          font-size: 15px;

          h1 {
            margin-block: 10px;
            font-size: 20px;
          }

          h2 {
            margin-block: 10px;
            font-size: 18px;
          }

          h3 {
            margin-block: 5px;
            font-size: 16px;
          }

          h4 {
            margin-block: 5px;
            font-size: 16px;
          }

          h5 {
            margin-block: 5px;
            font-size: 16px;
          }

          h6 {
            margin-block: 5px;
            font-size: 16px;
          }

          ul {
            padding-left: 25px;
          }

          a {
            color: black !important;
          }
        }
      }

      .meta {
        .lang {
          margin-right: 5px;
          font-size: 11px;

          &.secondary {
            background-color: #888;
          }
        }
      }
    }
  }

  #toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    min-width: 250px;
    max-width: 500px;
    padding: 20px;
    border: 2px solid #f00;
    border-radius: 7px;
    filter: drop-shadow(5px 5px 5px #ccc);
    background-color: #fdfdfd;
    text-align: justify;
  }
</style>
