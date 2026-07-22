import TypedProductList from "./TypedProductList"

export default function DeliveredWebsiteList() {
  return (
    <TypedProductList
      type="delivered-website"
      newLabel="New Delivered Website"
      emptyMessage="No delivered websites yet — add one to show it in the homepage showcase."
    />
  )
}
