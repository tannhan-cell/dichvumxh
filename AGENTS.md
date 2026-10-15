<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep SocialMedia presentation styles and semantic color tokens in src/styles.css, so every service view shares the same visual system.
- Service selection and informational dialogs are frontend-only; do not imply consultation requests are sent without a connected contact channel.
- Guest orders are created and looked up only through server functions in src/lib/orders.functions.ts (admin client, server-side pricing), because the orders table has no public RLS access.
- Admin rights come from public.user_roles via has_role; the first account ever registered becomes admin by trigger, so later signups get no access.
- Order alerts go to Telegram through the connector gateway from server code only.
