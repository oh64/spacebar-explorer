export default function ItemList({ items, type = 'client', onCardClick, onViewDetails }) {
  return (
    <div className="min-w-full">
      <ul className="w-full space-y-4">
        {items.map((item, index) => {
          const ItemCard = require('./ItemCard').default;
          return (
            <ItemCard
              key={item.id}
              item={item}
              index={index}
              type={type}
              onCardClick={onCardClick}
              onViewDetails={onViewDetails}
            />
          );
        })}
      </ul>
    </div>
  );
}
