export interface Event {
  id: number;
  name: string;
  description: string;
  location: string;
  kind: string;
  max_people: number;
  nbr_subscribers: number;
  begin_at: string;
  end_at: string;
  cursus_ids: number[];
}
