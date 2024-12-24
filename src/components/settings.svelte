<script lang="ts">
  interface Props {
    expandDescriptions: boolean
    githubToken: string | null
    logout: () => void
  }

  let {
    expandDescriptions = $bindable(),
    // eslint-disable-next-line prefer-const
    logout,
    // eslint-disable-next-line prefer-const
    githubToken,
  }: Props = $props()

  let settingsOpen = $state(false)

  function toggleSettings(): void {
    settingsOpen = !settingsOpen
  }
</script>

<div id="settings_btn">
  <button onclick={toggleSettings}>
    <img
      src="./gear.svg"
      alt="Settings"
    /></button
  >
</div>

{#if settingsOpen}
  <div id="settings">
    <div>
      <input
        type="checkbox"
        bind:checked={expandDescriptions}
      />
      Expand Descriptions
    </div>

    {#if githubToken}
      <div id="logout">
        <button
          onclick={(): void => {
            logout()
            toggleSettings()
          }}>Logout</button
        >
      </div>
    {/if}
  </div>
{/if}

<style lang="scss">
  #settings_btn {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 100;

    button {
      margin: 0;
      padding: 5px 8px;
      line-height: 15px;

      img {
        width: 15px;
        height: 15px;
      }
    }
  }

  #settings {
    position: fixed;
    top: 55px;
    right: 55px;
    z-index: 100;
    width: 300px;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 7px;
    background-color: #fdfdfd;
    filter: drop-shadow(5px 5px 5px #ccc);

    #logout {
      margin-top: 20px;
      text-align: center;
    }
  }
</style>
