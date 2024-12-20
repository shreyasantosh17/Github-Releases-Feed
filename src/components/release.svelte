<script lang="ts">
  import { intlFormatDistance } from 'date-fns'

  import type { ReleaseObj } from 'src/github'

  interface Props {
    release: ReleaseObj
    truncateDescriptions: boolean
  }

  const { release, truncateDescriptions }: Props = $props()

  let descriptionDiv = $state<HTMLDivElement>()
  let expandDescriptionDiv = $state<HTMLDivElement>()
  let oversized = $state(false)

  const repo = $derived(release.repo)
  const owner = $derived(repo.owner)
  const licenseInfo = $derived(repo.licenseInfo)

  const starsFormatter = new Intl.NumberFormat('en', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumSignificantDigits: 3,
  })

  function expandDescription(): void {
    if (descriptionDiv) descriptionDiv.classList.remove('truncated')
    if (expandDescriptionDiv) expandDescriptionDiv.style.display = 'none'
  }

  $effect(() => {
    if (release.descriptionHTML !== undefined && descriptionDiv) {
      const rect = descriptionDiv.getBoundingClientRect()
      oversized = rect.height > 150
    }
  })
</script>

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

  <div
    class="description"
    class:truncated={truncateDescriptions && oversized}
    bind:this={descriptionDiv}
  >
    {#if release.descriptionHTML !== undefined}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html release.descriptionHTML}
    {:else}
      <img
        src="./loading.svg"
        alt="Loading..."
      />
    {/if}
  </div>

  {#if truncateDescriptions && oversized}
    <div
      class="expand_description"
      bind:this={expandDescriptionDiv}
    >
      <button onclick={expandDescription}>Read more</button>
    </div>
  {/if}

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

<style lang="scss">
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
      overflow-x: scroll;

      &.truncated {
        position: relative;
        max-height: 150px;
        overflow: hidden;

        &:after {
          content: '';
          position: absolute;
          left: 0px;
          right: 0px;
          height: 75%;
          bottom: 0px;
          background: linear-gradient(
            180deg,
            rgba(139, 167, 32, 0) 0%,
            rgba(255, 255, 255, 1) 100%
          );
        }
      }

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

    .expand_description {
      margin: 20px 0;

      button {
        border: none;
        background-color: transparent;
        font-size: 15px;
        font-weight: bold;
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
</style>
