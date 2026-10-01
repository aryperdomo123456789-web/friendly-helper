import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getUserChannelFavorites,
  toggleUserChannelFavorite,
} from "@/lib/favorites.functions";

export function useChannelFavorites(userId: string | null, serverId: string | null) {
  const queryClient = useQueryClient();
  const fetchFavorites = useServerFn(getUserChannelFavorites);
  const toggleFavorite = useServerFn(toggleUserChannelFavorite);
  const queryKey = ["channel-favorites", userId, serverId] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => fetchFavorites({ data: serverId! }),
    enabled: Boolean(userId && serverId),
    staleTime: 60_000,
    retry: 1,
  });

  const mutation = useMutation({
    mutationFn: (channelId: string) =>
      toggleFavorite({ data: { server_id: serverId!, channel_id: channelId } }),
    onMutate: async (channelId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<string[]>(queryKey) ?? [];
      const next = previous.includes(channelId)
        ? previous.filter((id) => id !== channelId)
        : [...previous, channelId];
      queryClient.setQueryData(queryKey, next);
      return { previous };
    },
    onError: (_error, _channelId, context) => {
      queryClient.setQueryData(queryKey, context?.previous ?? []);
      toast.error("Não foi possível atualizar este favorito.", { duration: 3000 });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const favoriteIds = query.data ?? [];
  return {
    ...query,
    favoriteIds,
    favoriteSet: new Set(favoriteIds),
    toggle: mutation.mutate,
    togglingId: mutation.isPending ? mutation.variables : null,
  };
}
