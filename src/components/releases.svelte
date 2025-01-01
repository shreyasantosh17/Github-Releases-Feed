<script lang="ts">
  import Release from './release.svelte'

  import type { ReleaseObj } from 'src/github'

  interface Props {
    allReleases: ReleaseObj[]
    expandDescriptions: boolean
    showLanguages: boolean
  }

  const { allReleases, expandDescriptions, showLanguages }: Props = $props()
</script>

<div id="releases">
  {#each allReleases as release (release.id)}
    <Release
      {release}
      {expandDescriptions}
      {showLanguages}
    />
  {/each}
</div>

<style lang="scss">
  #releases {
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
  }
</style>
