import { Link } from 'react-router-dom'
import { formatMinutes, getInitials, totalMinutes } from '../utils/format'
import { ChefHatIcon, ClockIcon, UsersIcon } from './Icons'

export default function RecipeCard({ recipe }) {
  return (
    <article className="recipe-card">
      <Link to={`/recipes/${recipe.id}`} className="recipe-card-link">
        <div className="recipe-card-media">
          {recipe.imageUrl ? (
            <img src={recipe.imageUrl} alt={recipe.title} loading="lazy" />
          ) : (
            <div className="image-fallback">
              <ChefHatIcon size={38} />
              <span>Recipe photo</span>
            </div>
          )}
          <span className="recipe-card-category">{recipe.category}</span>
          <span className="recipe-card-difficulty">{recipe.difficulty}</span>
        </div>

        <div className="recipe-card-body">
          <h3 className="recipe-card-title">{recipe.title}</h3>
          <p className="recipe-card-description">{recipe.description}</p>

          <div className="recipe-card-footer">
            <span className="meta-item" title="Total time">
              <ClockIcon size={15} />
              {formatMinutes(totalMinutes(recipe))}
            </span>
            <span className="meta-item" title="Servings">
              <UsersIcon size={15} />
              Serves {recipe.servings}
            </span>
            <span className="recipe-card-author">
              <span className="avatar avatar-xs">{getInitials(recipe.authorName)}</span>
              {recipe.authorName}
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
